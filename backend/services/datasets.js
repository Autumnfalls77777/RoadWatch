import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { id } from '../lib/store.js';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const datasetDir = join(root, 'dataset');

const PUNE_CENTER = [18.5204, 73.8567];
const WARD_OFFSETS = [
  [0.038, 0.034], [0.028, -0.012], [0.016, -0.038], [0.002, -0.058],
  [-0.018, -0.042], [-0.03, -0.018], [-0.032, 0.018], [-0.018, 0.048],
  [0.006, 0.056], [0.026, 0.046], [0.044, 0.012], [0.042, -0.026],
  [-0.046, 0.032], [-0.052, -0.012], [-0.044, -0.044],
];

export async function ingestDemoDatasets(store) {
  const files = await readdir(datasetDir);
  const condition = files.find(name => /condi?iton.*road/i.test(name));
  const remaining = files.filter(name => name !== condition && /\.(csv|xls|xlsx)$/i.test(name));
  const ordered = [condition, ...remaining].filter(Boolean);
  const results = [];

  for (const name of ordered) {
    const buffer = await readFile(join(datasetDir, name));
    results.push(await ingestDatasetBuffer(store, {
      name,
      version: inferVersion(name),
      buffer,
      extension: extname(name).slice(1).toLowerCase(),
    }));
  }
  return results;
}

export async function ingestUploadedDataset(store, payload) {
  const base64 = String(payload.contentBase64 || '').split(',').pop();
  const buffer = Buffer.from(base64, 'base64');
  return ingestDatasetBuffer(store, {
    name: payload.name || 'Uploaded Dataset',
    version: payload.version || inferVersion(payload.name),
    buffer,
    extension: (payload.extension || extname(payload.name || '').slice(1)).toLowerCase(),
  });
}

async function ingestDatasetBuffer(store, file) {
  const started = new Date().toISOString();
  const dataset = {
    id: stableId('dst', file.name),
    name: cleanDatasetName(file.name),
    file_name: file.name,
    upload_date: started,
    version: file.version || 'v1',
    status: 'Processing',
    city: null,
    rows_processed: 0,
    generated: { cities: 0, wards: 0, roads: 0, metadata: 0 },
    errors: [],
  };
  upsertById(store.datasets, dataset);

  try {
    const rows = parseTabular(file.buffer, file.extension);
    const normalized = normalizeRows(rows);
    const profile = detectDatasetProfile(normalized, file.name);
    const result = applyRows(store, normalized, profile, dataset);
    Object.assign(dataset, {
      status: 'Ready',
      city: result.city,
      rows_processed: normalized.length,
      generated: result.generated,
      detected_columns: profile.columns,
      dataset_type: profile.type,
      updated_date: new Date().toISOString(),
    });
  } catch (error) {
    Object.assign(dataset, {
      status: 'Failed',
      errors: [error.message],
      updated_date: new Date().toISOString(),
    });
  }

  upsertById(store.datasets, dataset);
  refreshWardMetrics(store);
  refreshRoadComplaintCounts(store);
  return dataset;
}

function parseTabular(buffer, extension) {
  if (extension === 'csv') return parseCsv(buffer.toString('utf8'));
  if (extension === 'xlsx') return parseXlsx(buffer);
  if (extension === 'xls') return parseXls(buffer);
  throw new Error(`Unsupported dataset type: ${extension}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quote && next === '"') { cell += '"'; i++; continue; }
    if (ch === '"') { quote = !quote; continue; }
    if (ch === ',' && !quote) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return matrixToObjects(rows);
}

function parseXlsx(buffer) {
  const zip = unzipSync(new Uint8Array(buffer));
  const shared = parseSharedStrings(zip);
  const sheetPath = Object.keys(zip).find(name => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  if (!sheetPath) throw new Error('No worksheet found in XLSX file');
  const xml = strFromU8(zip[sheetPath]);
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const index = ref ? columnIndex(ref) : row.length;
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const value = /<v[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? /<t[^>]*>([\s\S]*?)<\/t>/.exec(body)?.[1] ?? '';
      row[index] = type === 's' ? shared[Number(value)] || '' : decodeXml(value);
    }
    if (row.some(v => String(v || '').trim())) rows.push(row);
  }
  return matrixToObjects(rows);
}

function parseSharedStrings(zip) {
  const file = zip['xl/sharedStrings.xml'];
  if (!file) return [];
  const xml = strFromU8(file);
  return [...xml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map(match =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => decodeXml(t[1])).join('')
  );
}

function parseXls(buffer) {
  const workbook = getOleStream(buffer, 'Workbook') || getOleStream(buffer, 'Book');
  if (!workbook) throw new Error('No Workbook stream found in legacy XLS file');
  const sst = [];
  const matrix = [];
  for (let offset = 0; offset + 4 <= workbook.length;) {
    const code = workbook.readUInt16LE(offset);
    const len = workbook.readUInt16LE(offset + 2);
    const start = offset + 4;
    const end = start + len;
    const data = workbook.subarray(start, end);
    if (code === 0x00fc) parseSst(data, sst);
    if (code === 0x0203 && len >= 14) setCell(matrix, data.readUInt16LE(0), data.readUInt16LE(2), readNumber(data, 6));
    if (code === 0x027e && len >= 10) setCell(matrix, data.readUInt16LE(0), data.readUInt16LE(2), decodeRk(data.readUInt32LE(6)));
    if (code === 0x00fd && len >= 10) setCell(matrix, data.readUInt16LE(0), data.readUInt16LE(2), sst[data.readUInt32LE(6)] || '');
    if (code === 0x00bd && len >= 6) {
      const row = data.readUInt16LE(0);
      const first = data.readUInt16LE(2);
      const last = data.readUInt16LE(4);
      for (let i = 0; i < last - first; i++) {
        const pos = 6 + i * 6;
        if (pos + 6 <= data.length) setCell(matrix, row, first + i, decodeRk(data.readUInt32LE(pos + 2)));
      }
    }
    offset = end;
  }
  return matrixToObjects(matrix.filter(r => r?.some(v => String(v ?? '').trim())));
}

function getOleStream(buffer, wantedName) {
  if (buffer.readUInt32BE(0) !== 0xd0cf11e0) return null;
  const sectorShift = buffer.readUInt16LE(30);
  const miniShift = buffer.readUInt16LE(32);
  const sectorSize = 1 << sectorShift;
  const miniSectorSize = 1 << miniShift;
  const firstDirSector = buffer.readInt32LE(48);
  const miniCutoff = buffer.readUInt32LE(56);
  const firstMiniFat = buffer.readInt32LE(60);
  const miniFatCount = buffer.readUInt32LE(64);
  const difat = [];
  for (let i = 0; i < 109; i++) {
    const value = buffer.readInt32LE(76 + i * 4);
    if (value >= 0) difat.push(value);
  }
  const fat = [];
  for (const sec of difat) {
    const sector = sectorBytes(buffer, sec, sectorSize);
    for (let i = 0; i < sector.length; i += 4) fat.push(sector.readInt32LE(i));
  }
  const dir = readChain(buffer, firstDirSector, fat, sectorSize);
  const entries = [];
  for (let offset = 0; offset + 128 <= dir.length; offset += 128) {
    const entry = dir.subarray(offset, offset + 128);
    const nameLen = entry.readUInt16LE(64);
    if (nameLen < 2) continue;
    entries.push({
      name: entry.subarray(0, nameLen - 2).toString('utf16le'),
      type: entry[66],
      start: entry.readInt32LE(116),
      size: Number(entry.readBigUInt64LE(120)),
    });
  }
  const target = entries.find(e => e.name === wantedName);
  if (!target) return null;
  if (target.size >= miniCutoff) return readChain(buffer, target.start, fat, sectorSize).subarray(0, target.size);
  const rootEntry = entries.find(e => e.type === 5);
  const miniStream = readChain(buffer, rootEntry.start, fat, sectorSize);
  const miniFat = readMiniFat(buffer, firstMiniFat, miniFatCount, fat, sectorSize);
  return readMiniChain(miniStream, target.start, target.size, miniFat, miniSectorSize);
}

function sectorBytes(buffer, sector, sectorSize) {
  const start = (sector + 1) * sectorSize;
  return buffer.subarray(start, start + sectorSize);
}

function readChain(buffer, start, fat, sectorSize) {
  const chunks = [];
  for (let sec = start, guard = 0; sec >= 0 && sec < fat.length && guard < 10000; sec = fat[sec], guard++) {
    chunks.push(sectorBytes(buffer, sec, sectorSize));
  }
  return Buffer.concat(chunks);
}

function readMiniFat(buffer, start, count, fat, sectorSize) {
  if (start < 0 || !count) return [];
  const bytes = readChain(buffer, start, fat, sectorSize);
  const out = [];
  for (let i = 0; i + 4 <= bytes.length; i += 4) out.push(bytes.readInt32LE(i));
  return out;
}

function readMiniChain(miniStream, start, size, miniFat, miniSectorSize) {
  const chunks = [];
  for (let sec = start, guard = 0; sec >= 0 && sec < miniFat.length && guard < 10000; sec = miniFat[sec], guard++) {
    const offset = sec * miniSectorSize;
    chunks.push(miniStream.subarray(offset, offset + miniSectorSize));
  }
  return Buffer.concat(chunks).subarray(0, size);
}

function parseSst(data, strings) {
  let offset = 8;
  while (offset + 3 <= data.length) {
    const chars = data.readUInt16LE(offset); offset += 2;
    const flags = data[offset++];
    const isWide = flags & 0x01;
    const rich = flags & 0x08 ? data.readUInt16LE(offset) : 0;
    if (flags & 0x08) offset += 2;
    const ext = flags & 0x04 ? data.readUInt32LE(offset) : 0;
    if (flags & 0x04) offset += 4;
    const byteLen = chars * (isWide ? 2 : 1);
    if (offset + byteLen > data.length) break;
    strings.push(isWide ? data.subarray(offset, offset + byteLen).toString('utf16le') : data.subarray(offset, offset + byteLen).toString('latin1'));
    offset += byteLen + rich * 4 + ext;
  }
}

function decodeRk(value) {
  const divided = value & 0x01;
  const integer = value & 0x02;
  let result;
  if (integer) result = value >> 2;
  else {
    const buf = Buffer.alloc(8);
    buf.writeUInt32LE(value & 0xfffffffc, 4);
    result = buf.readDoubleLE(0);
  }
  return divided ? result / 100 : result;
}

function readNumber(data, offset) {
  return Number(data.readDoubleLE(offset).toFixed(8));
}

function setCell(matrix, row, col, value) {
  matrix[row] ||= [];
  matrix[row][col] = value;
}

function matrixToObjects(matrix) {
  const headerIndex = matrix.findIndex(row => row?.filter(v => String(v || '').trim()).length >= 2);
  if (headerIndex < 0) return [];
  const headers = matrix[headerIndex].map(h => normalizeHeader(h));
  return matrix.slice(headerIndex + 1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) obj[header] = cleanValue(row?.[i]);
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined));
}

function normalizeRows(rows) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeHeader(k), cleanValue(v)])));
}

function detectDatasetProfile(rows, name) {
  const columns = Object.keys(rows[0] || {});
  const has = (...names) => names.some(n => columns.includes(n));
  const lower = name.toLowerCase();
  if (has('ward_no', 'city_name', 'zone_name') || lower.includes('condiiton') || lower.includes('condition')) return { type: 'ward_condition', columns };
  if (has('length_of_roads') && has('prabhag_name')) return { type: 'road_lengths', columns };
  if (has('percentage_of_roads_paved') || lower.includes('paved')) return { type: 'paved_roads', columns };
  return { type: 'road_lengths', columns };
}

function applyRows(store, rows, profile, dataset) {
  const generated = { cities: 0, wards: 0, roads: 0, metadata: 0 };
  const defaultCity = detectCity(rows);
  const city = upsertCity(store, defaultCity, dataset.id);
  generated.cities = city.created ? 1 : 0;

  rows.forEach((row, index) => {
    if (profile.type === 'ward_condition') {
      const ward = upsertWard(store, row, city.record, dataset.id, index);
      if (ward.created) generated.wards++;
      generated.metadata++;
      return;
    }
    if (profile.type === 'paved_roads') {
      const ward = upsertWard(store, row, city.record, dataset.id, index);
      if (ward.created) generated.wards++;
      const road = upsertRoad(store, row, city.record, ward.record, dataset.id, index);
      if (road.created) generated.roads++;
      updateRoadPavement(road.record, row);
      generated.metadata++;
      return;
    }
    const ward = upsertWard(store, row, city.record, dataset.id, index);
    if (ward.created) generated.wards++;
    const road = upsertRoad(store, row, city.record, ward.record, dataset.id, index);
    if (road.created) generated.roads++;
    updateRoadLengths(road.record, row);
    generated.metadata++;
  });

  return { city: city.record.name, generated };
}

function upsertCity(store, name, datasetId) {
  const cityId = stableId('city', name);
  let record = store.cities.find(c => c.id === cityId);
  const created = !record;
  if (!record) {
    record = { id: cityId, name, country: 'India', state: 'Maharashtra', district: name, created_date: new Date().toISOString() };
    store.cities.push(record);
  }
  record.dataset_ids = unique([...(record.dataset_ids || []), datasetId]);
  record.updated_date = new Date().toISOString();
  return { record, created };
}

function upsertWard(store, row, city, datasetId, index) {
  const wardName = text(row.ward_name || row.prabhag_name || row.area || `Ward ${row.ward_no || row.prabhag_no || index + 1}`);
  const wardNumber = number(row.ward_no || row.prabhag_no) || index + 1;
  const zone = text(row.zone_name || row.zone || row.area || 'Unassigned Zone');
  const wardId = stableId('ward', `${city.name}-${wardNumber}-${wardName}`);
  let record = store.wards.find(w => w.id === wardId);
  const created = !record;
  if (!record) {
    record = { id: wardId, created_date: new Date().toISOString() };
    store.wards.push(record);
  }
  Object.assign(record, {
    city_id: city.id,
    city: city.name,
    country: city.country,
    state: city.state,
    district: city.district,
    name: wardName,
    ward_name: wardName,
    ward_number: wardNumber,
    zone,
    zone_name: zone,
    authority_name: defaultAuthority(city.name),
    length_km: number(row.length_of_roads_in_km || row.length_of_roads) || record.length_km || 0,
    tar_road_length_km: number(row.length_of_tar_roads_in_km || row.length_of_tar_roads) || record.tar_road_length_km || 0,
    concrete_road_length_km: number(row.length_of_concrete_roads_in_km || row.length_of_concrete_roads) || record.concrete_road_length_km || 0,
    footpath_both_sides_km: number(row.length_of_roads_with_footpaths_on_both_sides_in_km || row.length_of_roads_with_footpath_on_both_sides) || record.footpath_both_sides_km || 0,
    footpath_one_side_km: number(row.length_of_roads_with_footpaths_on_one_side_in_km || row.length_of_roads_with_footpath_on_one_side) || record.footpath_one_side_km || 0,
    paved_percent: number(row.percentage_of_roads_paved) ?? record.paved_percent ?? null,
    usable_footpath_percent: number(row.percentage_of_roads_with_usable_footpaths) ?? record.usable_footpath_percent ?? null,
    dataset_ids: unique([...(record.dataset_ids || []), datasetId]),
    updated_date: new Date().toISOString(),
  });
  record.footpath_coverage_percent = calculateFootpathCoverage(record);
  record.health_score = calculateWardHealth(record);
  record.safety_score = calculateSafetyScore(record.health_score, record.footpath_coverage_percent);
  return { record, created };
}

function upsertRoad(store, row, city, ward, datasetId, index) {
  const roadName = text(row.prabhag_name || row.road_name || ward.name);
  const roadId = stableId('road', `${city.name}-${ward.ward_number}-${roadName}`);
  let record = store.roads.find(r => r.id === roadId);
  const created = !record;
  if (!record) {
    const center = wardCenter(ward.ward_number || index + 1);
    record = {
      id: roadId,
      road_code: `RW-${city.name.slice(0, 3).toUpperCase()}-${String(ward.ward_number || index + 1).padStart(3, '0')}`,
      road_type: 'Municipal Ward Road',
      created_date: new Date().toISOString(),
      coordinates: makeRoadCoordinates(center, index),
      allocated_budget: 0,
      spent_budget: 0,
      budget_remaining: 0,
      total_complaints: 0,
      active_complaints: 0,
    };
    store.roads.push(record);
  }
  Object.assign(record, {
    name: roadName,
    road_name: roadName,
    city_id: city.id,
    city: city.name,
    country: city.country,
    state: city.state,
    district: city.district,
    ward_id: ward.id,
    ward: ward.name,
    ward_number: ward.ward_number,
    zone: ward.zone,
    authority_name: defaultAuthority(city.name),
    source_dataset_ids: unique([...(record.source_dataset_ids || []), datasetId]),
    status: record.status || healthStatus(record.health_score || ward.health_score),
    updated_date: new Date().toISOString(),
  });
  record.health_score = calculateRoadHealth(record, ward);
  record.safety_score = calculateSafetyScore(record.health_score, record.footpath_coverage_percent ?? ward.footpath_coverage_percent);
  return { record, created };
}

function updateRoadLengths(road, row) {
  road.length_km = number(row.length_of_roads) || road.length_km || 0;
  road.tar_road_length_km = number(row.length_of_tar_roads) || road.tar_road_length_km || 0;
  road.concrete_road_length_km = number(row.length_of_concrete_roads) || road.concrete_road_length_km || 0;
  road.footpath_both_sides_km = number(row.length_of_roads_with_footpath_on_both_sides) || road.footpath_both_sides_km || 0;
  road.footpath_one_side_km = number(row.length_of_roads_with_footpath_on_one_side) || road.footpath_one_side_km || 0;
  road.footpath_coverage_percent = calculateFootpathCoverage(road);
}

function updateRoadPavement(road, row) {
  road.paved_percent = number(row.percentage_of_roads_paved) ?? road.paved_percent ?? null;
  road.usable_footpath_percent = number(row.percentage_of_roads_with_usable_footpaths) ?? road.usable_footpath_percent ?? null;
}

function refreshWardMetrics(store) {
  for (const ward of store.wards) {
    const roads = store.roads.filter(r => r.ward_id === ward.id);
    if (roads.length) {
      ward.road_count = roads.length;
      ward.length_km = sum(roads, 'length_km') || ward.length_km || 0;
      ward.footpath_coverage_percent = avg(roads.map(r => r.footpath_coverage_percent).filter(v => v != null)) ?? ward.footpath_coverage_percent ?? 0;
      ward.health_score = Math.round(avg(roads.map(r => r.health_score).filter(Boolean)) ?? ward.health_score ?? 70);
    }
  }
  const ranked = [...store.wards].sort((a, b) => (b.health_score || 0) - (a.health_score || 0));
  ranked.forEach((ward, i) => ward.rank = i + 1);
}

function refreshRoadComplaintCounts(store) {
  for (const road of store.roads) {
    const complaints = store.complaints.filter(c => c.road_id === road.id);
    road.total_complaints = complaints.length || road.total_complaints || 0;
    road.active_complaints = complaints.filter(c => !['Resolved', 'completed', 'Completed'].includes(c.status)).length || road.active_complaints || 0;
  }
}

function detectCity(rows) {
  return text(rows.find(r => r.city_name)?.city_name || rows.find(r => r.city)?.city || 'Pune');
}

function defaultAuthority(city) {
  if (normalizeHeader(city) === 'pune') return 'Pune Municipal Corporation Road Department';
  return `${city} Municipal Road Department`;
}

function calculateWardHealth(ward) {
  const paved = ward.paved_percent ?? ((ward.tar_road_length_km + ward.concrete_road_length_km) / (ward.length_km || 1)) * 100;
  const footpath = ward.usable_footpath_percent ?? ward.footpath_coverage_percent ?? 0;
  return clamp(Math.round(paved * 0.55 + footpath * 0.35 + 10), 0, 100);
}

function calculateRoadHealth(road, ward) {
  const paved = road.paved_percent ?? ward.paved_percent ?? 75;
  const footpath = road.usable_footpath_percent ?? road.footpath_coverage_percent ?? ward.footpath_coverage_percent ?? 0;
  return clamp(Math.round(paved * 0.58 + footpath * 0.32 + 10), 0, 100);
}

function calculateFootpathCoverage(row) {
  if (row.usable_footpath_percent != null) return row.usable_footpath_percent;
  const length = Number(row.length_km || 0);
  if (!length) return 0;
  return clamp(Math.round((((Number(row.footpath_both_sides_km || 0) * 2) + Number(row.footpath_one_side_km || 0)) / (length * 2)) * 100), 0, 100);
}

function calculateSafetyScore(health, footpath) {
  return clamp(Math.round((Number(health || 0) * 0.65) + (Number(footpath || 0) * 0.35)), 0, 100);
}

function healthStatus(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Poor';
}

function wardCenter(numberValue) {
  const offset = WARD_OFFSETS[(Number(numberValue || 1) - 1) % WARD_OFFSETS.length];
  return [PUNE_CENTER[0] + offset[0], PUNE_CENTER[1] + offset[1]];
}

function makeRoadCoordinates(center, index) {
  const d = 0.006 + ((index % 5) * 0.0012);
  const tilt = ((index % 7) - 3) * 0.0008;
  return [[center[0] - d, center[1] - d / 2 + tilt], center, [center[0] + d, center[1] + d / 2 - tilt]];
}

function cleanDatasetName(name = '') {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function inferVersion(name = '') {
  return /20\d{2}/.exec(name)?.[0] || new Date().getFullYear().toString();
}

function stableId(prefix, value) {
  const slug = normalizeHeader(value).slice(0, 70) || 'record';
  let hash = 0;
  for (const ch of String(value)) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return `${prefix}_${slug}_${Math.abs(hash).toString(36)}`.replace(/_+/g, '_');
}

function upsertById(list, item) {
  const index = list.findIndex(row => row.id === item.id);
  if (index >= 0) list[index] = { ...list[index], ...item };
  else list.unshift(item);
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function cleanValue(value) {
  if (value == null) return '';
  if (typeof value === 'number') return Number(value.toFixed(6));
  const trimmed = decodeXml(String(value)).trim();
  if (!trimmed || /^-+$/.test(trimmed) || /^na$/i.test(trimmed)) return '';
  const numeric = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed.replace(/,/g, '')) ? numeric : trimmed;
}

function decodeXml(value) {
  return String(value).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function columnIndex(letters) {
  return letters.split('').reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

function text(value) {
  return String(value || '').trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + Number(value || 0), 0) / values.length;
}
