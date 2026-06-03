import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Circle, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers } from 'lucide-react';

const roadSegments = [
  // Mumbai
  { lat: 19.076, lng: 72.877, radius: 2500, score: 38, name: 'Western Express Highway', city: 'Mumbai', complaints: 34 },
  { lat: 19.018, lng: 72.848, radius: 1800, score: 55, name: 'Eastern Express Highway', city: 'Mumbai', complaints: 18 },
  { lat: 19.043, lng: 72.904, radius: 1500, score: 71, name: 'LBS Marg', city: 'Mumbai', complaints: 9 },
  // Delhi
  { lat: 28.613, lng: 77.209, radius: 4000, score: 43, name: 'NH-48 Delhi Stretch', city: 'Delhi', complaints: 52 },
  { lat: 28.671, lng: 77.236, radius: 2500, score: 61, name: 'Ring Road Delhi', city: 'Delhi', complaints: 21 },
  { lat: 28.535, lng: 77.391, radius: 2000, score: 78, name: 'Noida Expressway', city: 'Delhi', complaints: 6 },
  // Bengaluru
  { lat: 12.971, lng: 77.594, radius: 3000, score: 72, name: 'MG Road', city: 'Bengaluru', complaints: 8 },
  { lat: 12.934, lng: 77.622, radius: 2200, score: 55, name: 'Outer Ring Road', city: 'Bengaluru', complaints: 22 },
  // Chennai
  { lat: 13.083, lng: 80.270, radius: 3500, score: 81, name: 'Anna Salai', city: 'Chennai', complaints: 5 },
  // Pune
  { lat: 18.520, lng: 73.856, radius: 2000, score: 42, name: 'Ring Road Sector 12', city: 'Pune', complaints: 24 },
  // Hyderabad
  { lat: 17.385, lng: 78.486, radius: 3000, score: 66, name: 'ORR Hyderabad', city: 'Hyderabad', complaints: 14 },
];

function getColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

export default function RoadHeatmapPanel() {
  const [filter, setFilter] = useState('all');

  const filtered = roadSegments.filter(r => {
    if (filter === 'critical') return r.score < 40;
    if (filter === 'poor') return r.score >= 40 && r.score < 60;
    if (filter === 'good') return r.score >= 60;
    return true;
  });

  const counts = {
    excellent: roadSegments.filter(r => r.score >= 80).length,
    moderate: roadSegments.filter(r => r.score >= 60 && r.score < 80).length,
    poor: roadSegments.filter(r => r.score >= 40 && r.score < 60).length,
    critical: roadSegments.filter(r => r.score < 40).length,
  };

  return (
    <div className="space-y-4">
      {/* Legend + filters */}
      <div className="bg-card rounded-2xl border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />RoadWatch Heatmap — India</h3>
          <span className="text-xs text-muted-foreground">{filtered.length} segments shown</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { key: 'all', label: '🗺️ All Roads' },
            { key: 'critical', label: `🔴 Critical (${counts.critical})` },
            { key: 'poor', label: `🟠 Poor (${counts.poor})` },
            { key: 'good', label: `🟢 Good/Moderate (${counts.moderate + counts.excellent})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === f.key ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          {[['#22c55e', 'Excellent (≥80)'], ['#eab308', 'Moderate (60-79)'], ['#f97316', 'Poor (40-59)'], ['#ef4444', 'Critical (<40)']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border/60 shadow-lg" style={{ height: 480 }}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full" zoomControl={true}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {filtered.map((seg, i) => (
            <Circle
              key={i}
              center={[seg.lat, seg.lng]}
              radius={seg.radius}
              pathOptions={{
                color: getColor(seg.score),
                fillColor: getColor(seg.score),
                fillOpacity: seg.score < 40 ? 0.45 : seg.score < 60 ? 0.35 : 0.2,
                weight: seg.score < 40 ? 3 : 2,
                opacity: 0.8,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="font-semibold text-sm mb-1">{seg.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{seg.city}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: getColor(seg.score) }}></div>
                    <span className="text-xs font-medium">{getLabel(seg.score)} — Score: {seg.score}/100</span>
                  </div>
                  <div className="text-xs text-gray-500">{seg.complaints} complaints filed</div>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Road List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.sort((a, b) => a.score - b.score).slice(0, 6).map((seg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm font-sora flex-shrink-0"
              style={{ background: getColor(seg.score) }}>
              {seg.score}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{seg.name}</div>
              <div className="text-xs text-muted-foreground">{seg.city} · {seg.complaints} complaints</div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${seg.score}%`, background: getColor(seg.score) }}></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}