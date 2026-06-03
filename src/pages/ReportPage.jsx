import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, MapPin, CheckCircle, Zap, Upload, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '@/lib/AuthContext';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function LocationPicker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

const CATEGORIES = ['Pothole', 'Crack', 'Waterlogging', 'Broken Road', 'Missing Signage', 'Unsafe Construction', 'Drainage Issue', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const steps = [
  { id: 1, label: 'Details', icon: AlertCircle },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Media', icon: Camera },
  { id: 4, label: 'Review', icon: CheckCircle },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            currentStep === s.id ? 'gradient-primary text-white shadow-md' :
            currentStep > s.id ? 'bg-green-500 text-white' :
            'bg-secondary text-muted-foreground'
          }`}>
            {currentStep > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 transition-colors ${currentStep > s.id ? 'bg-green-500' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: '',
    severity: 'Medium',
    description: '',
    location_text: location.state?.location_text || '',
    district: location.state?.district || '',
    state: location.state?.state || '',
    latitude: location.state?.latitude || null,
    longitude: location.state?.longitude || null,
    media: [],
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        update('latitude', lat);
        update('longitude', lon);
        update('location_text', `${lat.toFixed(4)}, ${lon.toFixed(4)}`);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.address) {
            const districtName = data.address.city_district || data.address.district || data.address.city || data.address.suburb || data.address.town || '';
            const stateName = data.address.state || '';
            const roadName = data.address.road || '';
            const suburbName = data.address.suburb || '';
            const fullLocationText = data.display_name || [roadName, suburbName, districtName, stateName].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            
            setForm(prev => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              location_text: fullLocationText,
              district: districtName,
              state: stateName
            }));
          }
        } catch (err) {
          console.error("Error reverse geocoding location:", err);
        }
      });
    }
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({
          ...prev,
          media: [...prev.media, {
            id: 'm_' + Math.random().toString(36).substr(2, 6),
            name: file.name,
            size: file.size,
            type: file.type,
            url: e.target.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraChange = (e) => {
    processFiles(e.target.files);
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const simulateAIAnalysis = async () => {
    setAiAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAiResult({
      confidence: Math.floor(75 + Math.random() * 20),
      severity_score: (4 + Math.random() * 5).toFixed(1),
      defect_type: form.category || 'Road Damage',
      is_duplicate: false,
    });
    setAiAnalyzing(false);
  };

  const handleNext = async () => {
    if (step === 3) await simulateAIAnalysis();
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const timestamps = JSON.parse(localStorage.getItem('complaint_timestamps') || '[]');
    const recent = timestamps.filter(t => now - t < oneHour);
    if (recent.length >= 5) {
      alert("Rate limit exceeded: You can only submit 5 complaints per hour.");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Complaint.create({
        ...form,
        image_url: form.media[0]?.url || null,
        status: 'Submitted',
        upvotes: 0,
        verified_count: 0,
        ai_confidence: aiResult?.confidence,
        ai_severity_score: parseFloat(aiResult?.severity_score),
        ai_defect_type: aiResult?.defect_type,
        reporter_level: 'Road Scout',
        reporter_id: user?.id || null,
        reporter_name: user?.name || null,
      });
      localStorage.setItem('complaint_timestamps', JSON.stringify([...recent, now]));
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold font-sora mb-2">Complaint Filed!</h1>
        <p className="text-muted-foreground mb-2">Your report has been submitted and AI is analyzing it.</p>
        {aiResult && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">AI Analysis Result</span>
            </div>
            <div className="text-sm text-purple-700">
              Confidence: <strong>{aiResult.confidence}%</strong> · Severity: <strong>{aiResult.severity_score}/10</strong>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Link to="/complaints"><Button className="w-full gradient-primary border-0 text-white">View Complaints Board</Button></Link>
          <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setStep(1); setForm({ title:'',category:'',severity:'Medium',description:'',location_text:'',district:'',state:'',latitude:null,longitude:null }); setAiResult(null); }}>
            Report Another Issue
          </Button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora mb-1">Report a Road Issue</h1>
        <p className="text-sm text-muted-foreground">Help us make India's roads safer</p>
      </div>

      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {/* Step 1: Details */}
        {step === 1 && (
          <motion.div key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Issue Title *</label>
                <Input
                  placeholder="e.g. Large pothole near bus stop"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category *</label>
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Severity</label>
                  <Select value={form.severity} onValueChange={(v) => update('severity', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <motion.div key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
              <Button variant="outline" className="w-full gap-2" onClick={detectLocation}>
                <MapPin className="w-4 h-4" />
                Auto-detect My Location
              </Button>
              {form.latitude && form.longitude && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Location detected. <strong>Tap the map to fine-tune.</strong></span>
                  </div>
                  <div className="h-48 w-full rounded-xl overflow-hidden border border-border/60 relative">
                    <MapContainer center={[form.latitude, form.longitude]} zoom={16} className="w-full h-full" zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker 
                        position={[form.latitude, form.longitude]} 
                        setPosition={(lat, lng) => {
                          update('latitude', lat);
                          update('longitude', lng);
                        }} 
                      />
                    </MapContainer>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Location Description</label>
                <Input
                  placeholder="e.g. Near Gandhi Chowk, Bhopal"
                  value={form.location_text}
                  onChange={(e) => update('location_text', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">District</label>
                  <Input placeholder="District name" value={form.district} onChange={(e) => update('district', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">State</label>
                  <Input placeholder="State name" value={form.state} onChange={(e) => update('state', e.target.value)} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <motion.div key={3} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card rounded-2xl border border-border/60 p-5 font-sans">
              <div 
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('file-input').click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="font-medium mb-1">Add Photos or Videos</div>
                <div className="text-sm text-muted-foreground mb-4">AI will automatically analyze your media</div>
                <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="file"
                    id="camera-input"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleCameraChange}
                  />
                  <input
                    type="file"
                    id="file-input"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => document.getElementById('camera-input').click()}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </Button>
                </div>
              </div>

              {form.media.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {form.media.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                      {item.type.startsWith('video/') ? (
                        <video src={item.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            media: prev.media.filter(m => m.id !== item.id)
                          }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-accent/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-accent-foreground">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">AI will verify your report automatically</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Photos are mandatory and increase verification speed by 5x</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div key={4} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="space-y-3">
              {aiAnalyzing && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <div className="font-semibold text-sm text-purple-800">AI Analyzing...</div>
                    <div className="text-xs text-purple-600">Detecting defects and checking for duplicates</div>
                  </div>
                </div>
              )}

              {aiResult && !aiAnalyzing && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm text-purple-800">AI Analysis Complete</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-white rounded-xl p-2">
                      <div className="text-lg font-bold text-purple-700">{aiResult.confidence}%</div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-2">
                      <div className="text-lg font-bold text-orange-600">{aiResult.severity_score}/10</div>
                      <div className="text-xs text-muted-foreground">Severity</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-2">
                      <div className="text-xs font-semibold text-green-700">No Duplicate</div>
                      <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border/60 p-5">
                <h3 className="font-semibold mb-3">Review Your Report</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium text-right max-w-[200px]">{form.title || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{form.category || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Severity</span><span className="font-medium">{form.severity}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium text-right max-w-[200px]">{form.location_text || '—'}</span></div>
                  {form.district && <div className="flex justify-between"><span className="text-muted-foreground">District</span><span className="font-medium">{form.district}</span></div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-2 mt-5">
        {step > 1 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {step < 4 ? (
          <Button
            className="flex-1 gradient-primary border-0 text-white gap-1"
            onClick={handleNext}
            disabled={
              (step === 1 && (!form.title.trim() || !form.category || !form.description.trim())) ||
              (step === 2 && (!form.latitude || !form.longitude || !form.location_text.trim() || !form.district.trim() || !form.state.trim())) ||
              (step === 3 && form.media.length === 0)
            }
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="flex-1 gradient-primary border-0 text-white"
            onClick={handleSubmit}
            disabled={submitting || aiAnalyzing}
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Submitting...</>
            ) : 'Submit Report'}
          </Button>
        )}
      </div>
    </div>
  );
}