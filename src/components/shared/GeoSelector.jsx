import { useState, useEffect } from 'react';
import { Globe, MapPin, Navigation, Landmark } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const geoHierarchy = {
  'India': {
    'Maharashtra': {
      'Pune': [
        'Shivajinagar-Ghole Road Ward Office',
        'Aundh-Baner Ward Office',
        'Kothrud-Bawdhan Ward Office',
        'Warje-Karvenagar Ward Office',
        'Hadapsar-Mundhwa Ward Office'
      ],
      'Mumbai': ['Colaba Ward', 'Andheri Ward', 'Bandra Ward']
    },
    'Tamil Nadu': {
      'Chennai': ['Adyar Ward', 'Anna Nagar Ward', 'Teynampet Ward']
    },
    'Karnataka': {
      'Bengaluru': ['Hebbal Ward', 'Nagawara Ward', 'Whitefield Ward']
    },
    'Delhi': {
      'Delhi': ['New Delhi Central', 'Gurugram Border Segment']
    }
  },
  'USA': {
    'California': {
      'Los Angeles': ['Downtown', 'Hollywood', 'Santa Monica']
    }
  },
  'UK': {
    'England': {
      'London': ['City of London', 'Westminster', 'Camden']
    }
  },
  'UAE': {
    'Dubai': {
      'Dubai Central': ['Downtown Dubai', 'Marina', 'Jumeirah']
    }
  }
};

export default function GeoSelector({ onChange }) {
  const [country, setCountry] = useState('ALL');
  const [state, setState] = useState('ALL');
  const [district, setDistrict] = useState('ALL');
  const [ward, setWard] = useState('ALL');

  const countries = Object.keys(geoHierarchy);
  const states = country !== 'ALL' ? Object.keys(geoHierarchy[country] || {}) : [];
  const districts = (country !== 'ALL' && state !== 'ALL') ? Object.keys(geoHierarchy[country]?.[state] || {}) : [];
  const wards = (country !== 'ALL' && state !== 'ALL' && district !== 'ALL') ? geoHierarchy[country]?.[state]?.[district] || [] : [];

  useEffect(() => {
    const filters = {};
    if (country !== 'ALL') filters.country = country;
    if (state !== 'ALL') filters.state = state;
    if (district !== 'ALL') filters.district = district;
    if (ward !== 'ALL') filters.ward = ward;
    onChange(filters);
  }, [country, state, district, ward]);

  const handleCountryChange = (val) => {
    setCountry(val);
    setState('ALL');
    setDistrict('ALL');
    setWard('ALL');
  };

  const handleStateChange = (val) => {
    setState(val);
    setDistrict('ALL');
    setWard('ALL');
  };

  const handleDistrictChange = (val) => {
    setDistrict(val);
    setWard('ALL');
  };

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/60 p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <Globe className="w-3 h-3 text-primary" /> Country
        </label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="h-9 bg-slate-950/40 text-xs border-slate-800">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
            <SelectItem value="ALL" className="text-xs hover:bg-slate-800">All Countries</SelectItem>
            {countries.map(c => <SelectItem key={c} value={c} className="text-xs hover:bg-slate-800">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary" /> State / Region
        </label>
        <Select value={state} onValueChange={handleStateChange} disabled={country === 'ALL'}>
          <SelectTrigger className="h-9 bg-slate-950/40 text-xs border-slate-800">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
            <SelectItem value="ALL" className="text-xs hover:bg-slate-800">All States</SelectItem>
            {states.map(s => <SelectItem key={s} value={s} className="text-xs hover:bg-slate-800">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <Landmark className="w-3 h-3 text-primary" /> District / City
        </label>
        <Select value={district} onValueChange={handleDistrictChange} disabled={state === 'ALL'}>
          <SelectTrigger className="h-9 bg-slate-950/40 text-xs border-slate-800">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
            <SelectItem value="ALL" className="text-xs hover:bg-slate-800">All Districts</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d} className="text-xs hover:bg-slate-800">{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <Navigation className="w-3 h-3 text-primary" /> Local Ward
        </label>
        <Select value={ward} onValueChange={setWard} disabled={district === 'ALL'}>
          <SelectTrigger className="h-9 bg-slate-950/40 text-xs border-slate-800">
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
            <SelectItem value="ALL" className="text-xs hover:bg-slate-800">All Wards</SelectItem>
            {wards.map(w => <SelectItem key={w} value={w} className="text-xs hover:bg-slate-800">{w}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
