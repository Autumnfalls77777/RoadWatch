import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Link, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Layers, Search, X, MapPin, AlertCircle, ThumbsUp, DollarSign, Shield, Info, ArrowUpRight, Wrench, Coins, Building, Activity, Calendar, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const severityColors = {
  Low: '#3b82f6',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

function createComplaintIcon(severity) {
  const color = severityColors[severity] || '#3b82f6';
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;border-radius:50%;background:white;opacity:0.9;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const LAYERS = [
  { id: 'roads', label: 'Road Risk Markers', icon: Building, color: 'text-blue-500' },
  { id: 'wards', label: 'Ward Health Indicators', icon: MapIcon, color: 'text-emerald-500' },
  { id: 'complaints', label: 'Issue Clusters', icon: AlertCircle, color: 'text-red-500' },
];

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

function getRoadColor(score) {
  if (score >= 80) return '#22c55e'; // Green - Excellent
  if (score >= 60) return '#eab308'; // Yellow - Moderate
  if (score >= 40) return '#f97316'; // Orange - Poor
  return '#ef4444'; // Red - Critical
}

function createRiskIcon(score) {
  const color = getRoadColor(score || 0);
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(15,23,42,.32);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:10px;">${Math.round(score || 0)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function getRoadCenter(road) {
  const points = road.coordinates || [];
  if (!points.length) return [18.5204, 73.8567];
  const sums = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sums[0] / points.length, sums[1] / points.length];
}

function normalizeSearch(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function MapSearchController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.center) map.flyTo(target.center, target.zoom || 14, { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [roads, setRoads] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showLayers, setShowLayers] = useState({ complaints: true, roads: true, wards: true });
  const [showPanel, setShowPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [mapTarget, setMapTarget] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const location = useLocation();

  useEffect(() => {
    Promise.all([
      base44.entities.Complaint.list('-created_date', 50),
      base44.entities.Road.list(),
      base44.entities.Ward.list('-rank', 200)
    ]).then(([complaintsData, roadsData, wardData]) => {
      setComplaints(complaintsData.filter(c => c.latitude && c.longitude));
      setRoads(roadsData);
      setWards(wardData);
      setLoading(false);

      if (location.state?.targetLocation) {
        setMapTarget({ center: location.state.targetLocation, zoom: 18 });
        setClickedLocation(location.state.targetLocation);
      }
    }).catch(() => setLoading(false));
  }, [location.state]);

  // Debounced search autocomplete
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetch(`http://localhost:8787/api/search?q=${encodeURIComponent(search)}`)
        .then(r => {
          if (!r.ok) throw new Error('Search failed');
          return r.json();
        })
        .then(data => {
          setSuggestions(data || []);
        })
        .catch(() => {
          // fallback to client-side filter
          const query = normalizeSearch(search);
          const localRoads = roads.filter(r => [
            r.name, r.road_code, r.ward, r.city, r.authority_name, r.contractor_name
          ].some(v => normalizeSearch(v).includes(query)));
          const localWards = wards.filter(w => [w.name, w.ward_name, w.city, w.zone, w.ward_number].some(v => normalizeSearch(v).includes(query)));
          setSuggestions([...localRoads.map(r => ({ ...r, result_type: 'road' })), ...localWards.map(w => ({ ...w, result_type: 'ward' }))]);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, roads, wards]);

  const query = normalizeSearch(search);
  const matchingCities = [...new Map(roads.filter(r => query && normalizeSearch(r.city || r.district).includes(query)).map(r => [r.city || r.district, { name: r.city || r.district, center: getRoadCenter(r), zoom: 12 }])).values()];

  const filtered = complaints.filter(c =>
    (activeFilter === 'All' || c.severity === activeFilter) &&
    (!query || [c.title, c.location_text, c.district, c.ward].some(v => normalizeSearch(v).includes(query)))
  );

  const visibleRoads = query ? suggestions.filter(item => (item.result_type || 'road') === 'road') : roads;

  const handleRoadClick = (road, latlng) => {
    if (latlng) {
      setClickedLocation(latlng);
      setMapTarget({ center: latlng, zoom: 18 });
    } else {
      const center = getRoadCenter(road);
      setClickedLocation({ lat: center[0], lng: center[1] });
      setMapTarget({ center: center, zoom: 18 });
    }
    // Fetch full profile from backend
    fetch(`http://localhost:8787/api/roads/${road.id}`)
      .then(r => {
        if (!r.ok) throw new Error('Road detail failed');
        return r.json();
      })
      .then(fullRoad => {
        setSelectedRoad(fullRoad);
      })
      .catch(() => {
        setSelectedRoad(road);
      });
    setSelectedComplaint(null);
  };

  const runSearch = () => {
    if (!search.trim()) return;
    const road = suggestions.find(item => (item.result_type || 'road') === 'road');
    if (road) {
      handleRoadClick(road);
      setMapTarget({ center: getRoadCenter(road), zoom: 15 });
      return;
    }
    const ward = suggestions.find(item => item.result_type === 'ward');
    if (ward) {
      const wardRoad = roads.find(r => r.ward_id === ward.id || r.ward === ward.name);
      if (wardRoad) setMapTarget({ center: getRoadCenter(wardRoad), zoom: 13 });
      return;
    }
    const city = matchingCities[0];
    if (city) setMapTarget({ center: city.center, zoom: city.zoom });
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Crore`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden flex">
      {/* Map Content */}
      <div className="relative flex-1 h-full z-0">
        <MapContainer
          center={[18.5204, 73.8567]} // Centered in Pune Pilot City
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapSearchController target={mapTarget} />

          {/* Road Risk Markers */}
          {showLayers.roads && visibleRoads.map((road) => (
            <Marker
              key={road.id}
              position={getRoadCenter(road)}
              icon={createRiskIcon(road.health_score)}
              eventHandlers={{
                click: (e) => handleRoadClick(road, e.latlng),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <div className="font-bold text-sm">{road.name || road.road_name}</div>
                  <div className="text-xs text-muted-foreground">{road.ward} · {road.city || road.district}</div>
                  <Link to={`/road/${road.id}`} className="text-xs text-primary font-bold hover:underline mt-2 inline-flex items-center">
                    Open Road Profile <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Ward Health Indicators */}
          {showLayers.wards && wards.map((ward) => {
            const wardRoad = roads.find(r => r.ward_id === ward.id || r.ward === ward.name);
            if (!wardRoad) return null;
            const center = getRoadCenter(wardRoad);
            return (
            <CircleMarker
              key={ward.id}
              center={center}
              radius={18}
              pathOptions={{
                color: getRoadColor(ward.health_score),
                fillColor: getRoadColor(ward.health_score),
                fillOpacity: 0.22,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setMapTarget({ center, zoom: 13 }),
              }}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-semibold text-sm">{ward.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Ward {ward.ward_number} · {ward.zone}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Health: <strong className="text-foreground">{ward.health_score}/100</strong></div>
                  <Link to={`/wards/${ward.id}`} className="text-xs text-primary font-bold hover:underline mt-2 inline-flex items-center">
                    Open Ward Profile <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          )})}

          {/* Clicked Location Pin */}
          {selectedRoad && clickedLocation && (
            <Marker 
              position={clickedLocation} 
              icon={L.divIcon({
                className: '',
                html: `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;animation:pulse 1.5s infinite;"><div style="width:8px;height:8px;border-radius:50%;background:white;"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })} 
            />
          )}

          {/* Complaint markers */}
          {showLayers.complaints && filtered.map((c) => (
            <Marker
              key={c.id}
              position={[c.latitude, c.longitude]}
              icon={createComplaintIcon(c.severity)}
              eventHandlers={{
                click: () => {
                  setSelectedComplaint(c);
                  setSelectedRoad(null); // Close road segment details if open
                  setClickedLocation(null);
                }
              }}
            >
              <Popup>
                <div className="p-1.5 min-w-[200px] space-y-2">
                  {c.image_url && (
                    <img src={c.image_url} alt="Report Media" className="w-full h-28 object-cover rounded-md border border-border/50" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-foreground leading-snug line-clamp-1">{c.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="line-clamp-1">{c.location_text}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-center flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                      c.severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      c.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>{c.severity}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground font-semibold border border-border/60">{c.status}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-border/50">
                    <div className="text-[10px] text-muted-foreground font-semibold">AI Conf: {(c.ai_confidence * 100).toFixed(0)}%</div>
                    <Link to={`/complaints/${c.id}`} className="text-xs text-primary font-bold hover:underline flex items-center">
                      Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-[999] flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search roads, cities, wards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              className="pl-10 bg-white/95 backdrop-blur-sm border-border/60 shadow-md rounded-2xl h-11"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setMapTarget({ center: [18.5204, 73.8567], zoom: 13 }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {query && (suggestions.length > 0 || matchingCities.length > 0) && (
              <div className="absolute top-12 left-0 right-0 bg-white/98 backdrop-blur-sm border border-border/60 rounded-2xl shadow-lg overflow-hidden">
                {[...suggestions.slice(0, 5).map(r => r.result_type === 'ward'
                  ? ({ type: 'Ward', label: r.name || r.ward_name, sub: `Ward ${r.ward_number || ''} · ${r.city || ''}`, center: getRoadCenter(roads.find(road => road.ward_id === r.id || road.ward === r.name) || roads[0] || {}), zoom: 13, ward: r })
                  : ({ type: 'Road', label: r.name || r.road_name, sub: `${r.ward || ''} · ${r.health_score || 0}/100`, center: getRoadCenter(r), zoom: 15, road: r })),
                  ...matchingCities.slice(0, 3).map(c => ({ type: 'City', label: c.name, sub: 'City / locality match', center: c.center, zoom: c.zoom }))].map(item => (
                  <button
                    key={`${item.type}-${item.label}`}
                    onClick={() => {
                      setMapTarget({ center: item.center, zoom: item.zoom });
                      if (item.road) { handleRoadClick(item.road); }
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-secondary/50 border-b border-border/30 last:border-b-0"
                  >
                    <div className="text-xs font-bold text-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.type} · {item.sub}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer toggle */}
          <Button
            variant="outline"
            size="icon"
            className="bg-white/95 backdrop-blur-sm shadow-md rounded-2xl h-11 w-11"
            onClick={() => setShowPanel(p => !p)}
          >
            <Layers className="w-5 h-5 text-foreground" />
          </Button>

          {/* Pilot Hub Info Badge */}
          <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md px-3.5 py-2.5 text-xs font-semibold select-none border border-blue-500/20">
            <Shield className="w-4 h-4 shrink-0" />
            <span>PMC Pilot Hub: Pune</span>
          </div>
        </div>

        {/* Layer Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-16 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl border border-border/60 shadow-lg p-4 min-w-[220px]"
            >
              <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                <span className="font-bold text-sm text-foreground">Transparency Layers</span>
                <button onClick={() => setShowPanel(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
              </div>
              <div className="space-y-1">
                {LAYERS.map(l => (
                  <label key={l.id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showLayers[l.id]}
                      onChange={() => setShowLayers(prev => ({ ...prev, [l.id]: !prev[l.id] }))}
                      className="rounded accent-primary w-4 h-4 border-border/80"
                    />
                    <l.icon className={`w-4 h-4 ${l.color} shrink-0`} />
                    <span className="text-sm font-medium text-foreground">{l.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Severity Filter Pills */}
        <div className="absolute bottom-4 left-4 right-4 z-[999] flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl border border-border/60 shadow-lg px-3 py-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {f} Issues
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1 shrink-0"></div>
            <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
              {filtered.length} clusters · {visibleRoads.length} road markers · {wards.length} wards
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-border/60 shadow-lg px-4 py-2.5 text-xs font-semibold">
            {[
              { color: 'bg-green-500', label: 'Excellent' },
              { color: 'bg-yellow-500', label: 'Moderate' },
              { color: 'bg-orange-500', label: 'Poor' },
              { color: 'bg-red-500', label: 'Critical' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color} shrink-0`}></div>
                <span className="text-muted-foreground text-[11px]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[1001]">
            <div className="bg-card rounded-2xl border border-border/60 px-6 py-4 flex items-center gap-3 shadow-lg">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Resolving Pune Geo-Spatial Data...</span>
            </div>
          </div>
        )}

        {/* Link to report */}
        <Link
          to="/report"
          className="absolute bottom-20 right-4 z-[999] lg:bottom-16"
        >
          <Button className="gradient-primary border-0 text-white shadow-lg gap-2 rounded-2xl h-11 px-5 font-bold">
            <AlertCircle className="w-4 h-4" />
            Report Pothole
          </Button>
        </Link>
      </div>

      {/* Road Segment Details Drawer Panel (IIT Hackathon Transparency Flagship Widget) */}
      <AnimatePresence>
        {selectedRoad && (
          <motion.div
            initial={{ opacity: 0, x: 350 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 350 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="w-96 bg-card border-l border-border/60 h-full flex flex-col shadow-2xl z-[1000] relative overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/60 bg-gradient-to-br from-primary/5 to-transparent flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="border-primary/30 text-primary font-bold bg-primary/5">
                    {road_code_display(selectedRoad.road_code)}
                  </Badge>
                  <Badge variant="secondary" className="font-semibold text-[10px]">
                    {selectedRoad.road_type}
                  </Badge>
                </div>
                <h2 className="font-bold text-lg font-sora text-foreground leading-snug">{selectedRoad.name}</h2>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{selectedRoad.ward}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRoad(null)}
                className="w-8 h-8 rounded-full shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Information Integration Badges Layer */}
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Data Sources & Trust Badges</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">OSM Base Data</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">PMC Asset Registry</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">AI Condition Scan</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">Citizen Reports</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">PWD Audited</span>
                </div>
              </div>

              {/* Road Health Score Card */}
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold">Calculated Road Health</div>
                  <div className="text-2xl font-black text-foreground font-sora">
                    {selectedRoad.health_score}<span className="text-xs text-muted-foreground font-semibold">/100</span>
                  </div>
                  <div className="text-xs font-bold" style={{ color: getRoadColor(selectedRoad.health_score) }}>
                    {getHealthCategory(selectedRoad.health_score)} Condition
                  </div>
                </div>
                {/* Visual health score circle */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 relative" style={{ borderColor: getRoadColor(selectedRoad.health_score) + '20' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black font-sora text-sm" style={{ color: getRoadColor(selectedRoad.health_score), background: getRoadColor(selectedRoad.health_score) + '10' }}>
                    {selectedRoad.health_score}%
                  </div>
                </div>
              </div>

              {/* Authority Routing System Info */}
              <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Authority Routing Chain</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Road</span>
                    <span className="font-semibold text-foreground text-right truncate max-w-[180px]">{selectedRoad.name.split(' (')[0]}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">PMC Ward</span>
                    <span className="font-semibold text-foreground text-right truncate max-w-[180px]">{selectedRoad.ward.split(' Ward')[0]} Ward</span>
                  </div>
                  <div className="flex justify-between items-start py-0.5">
                    <span className="text-muted-foreground font-medium shrink-0">Responsible Agency</span>
                    <span className="font-semibold text-foreground text-right max-w-[180px]">{selectedRoad.authority_name}</span>
                  </div>
                </div>
              </div>

              {/* Road Condition Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-secondary/30 rounded-xl p-3 border border-border/40">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold text-foreground mt-0.5">{selectedRoad.last_repair_date ? new Date(selectedRoad.last_repair_date).toLocaleDateString('en-IN', {month: 'short', year: 'numeric'}) : 'Never'}</div>
                  <div className="text-[10px] text-muted-foreground">Last Repaired</div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-3 border border-border/40">
                  <AlertCircle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold text-foreground mt-0.5">{selectedRoad.active_complaints} Active</div>
                  <div className="text-[10px] text-muted-foreground">Complaint Count</div>
                </div>
              </div>

              {/* Budget Transparency Panel */}
              {selectedRoad.is_osm ? (
                <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Budget Allocation</span>
                  </div>
                  <p className="text-muted-foreground leading-normal text-[11px]">
                    No municipal budget is allocated for this street segment. File a citizen report to bring this road under official inspection.
                  </p>
                </div>
              ) : (
                <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                      <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>Budget Allocation</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 font-bold text-[9px] py-0">PMC Audited</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-card rounded-lg p-1.5 border border-border/40">
                        <div className="text-muted-foreground font-medium">Allocated</div>
                        <div className="font-bold text-foreground mt-0.5 truncate">{formatCurrency(selectedRoad.allocated_budget)}</div>
                      </div>
                      <div className="bg-card rounded-lg p-1.5 border border-border/40">
                        <div className="text-muted-foreground font-medium">Spent</div>
                        <div className="font-bold text-green-600 mt-0.5 truncate">{formatCurrency(selectedRoad.spent_budget)}</div>
                      </div>
                      <div className="bg-card rounded-lg p-1.5 border border-border/40">
                        <div className="text-muted-foreground font-medium">Remaining</div>
                        <div className="font-bold text-blue-600 mt-0.5 truncate">{formatCurrency(selectedRoad.budget_remaining)}</div>
                      </div>
                    </div>

                    {/* Budget Spent Progress Bar */}
                    {selectedRoad.allocated_budget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Fund Utilization</span>
                          <span className="font-bold text-foreground">
                            {((selectedRoad.spent_budget / selectedRoad.allocated_budget) * 100).toFixed(0)}% Used
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${(selectedRoad.spent_budget / selectedRoad.allocated_budget) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>Source:</span>
                      <span className="font-bold text-foreground">{selectedRoad.funding_source || 'PMC Budget Fund'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contractor Information Panel */}
              {selectedRoad.is_osm ? (
                <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Assigned Contractor</span>
                  </div>
                  <div className="font-semibold text-muted-foreground text-[11px]">Unassigned (Public Street)</div>
                </div>
              ) : (
                <div className="bg-secondary/20 rounded-2xl p-4 border border-border/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Assigned Contractor</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground">{selectedRoad.contractor_name || 'Unassigned'}</div>
                      <div className="text-[10px] text-muted-foreground">PMC Class A Registered</div>
                    </div>
                    <Link to="/contractors">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5 font-bold hover:bg-secondary">
                        Scorecard
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-border/60 bg-gradient-to-tr from-secondary/30 to-card flex gap-2">
              <Link 
                to="/report" 
                state={{
                  location_text: selectedRoad.name,
                  district: selectedRoad.district || 'Pune',
                  state: selectedRoad.state || 'Maharashtra',
                  latitude: clickedLocation ? clickedLocation.lat : getRoadCenter(selectedRoad)[0],
                  longitude: clickedLocation ? clickedLocation.lng : getRoadCenter(selectedRoad)[1]
                }}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2 rounded-xl text-xs font-bold h-10">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  File Complaint
                </Button>
              </Link>
              {!selectedRoad.is_osm && (
                <Link to={`/road/${selectedRoad.id}`} className="flex-1">
                  <Button className="w-full gradient-primary border-0 text-white font-bold gap-2 rounded-xl text-xs h-10">
                    Detailed Twin
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function road_code_display(code) {
  return code || 'ROAD-ID';
}

function getHealthCategory(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Poor';
  return 'Critical';
}
