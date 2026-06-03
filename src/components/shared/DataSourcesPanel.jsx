import { Database, ShieldCheck, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sources = [
  { id: 'osm', name: 'OpenStreetMap (OSM)', type: 'Base Geo-Data', trust: 'High', description: 'Road geometries, alignments and node intersections' },
  { id: 'municipal', name: 'Municipal Asset Registry', type: 'Official Records', trust: 'Official', description: 'Road codes, wards divisions, PWD registry metadata' },
  { id: 'citizen', name: 'Citizen Complaints', type: 'Crowdsourced', trust: 'Community Validated', description: 'Real-time pothole, logging, and damage feeds' },
  { id: 'ai', name: 'AI Image Auditing', type: 'Computer Vision', trust: '91% Accurate', description: 'Pavement distress severity calculations from photographs' },
  { id: 'repair', name: 'Works & Repairs Ledger', type: 'Financial Bills', trust: 'Audited Ledger', description: 'Disbursed repair billing history and completion logs' },
  { id: 'budget', name: 'Tender & Allocations', type: 'Tender Records', trust: 'Govt Ledger', description: 'Assigned contractor funds and road relaying limits' }
];

export default function DataSourcesPanel({ activeSourceIds = ['osm', 'municipal', 'citizen', 'ai'] }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4 shadow-md">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary shrink-0" />
        <div>
          <h3 className="font-semibold text-white font-sora text-sm sm:text-base">Digital Twin Data Feed Layers</h3>
          <p className="text-xs text-muted-foreground">Integrating heterogeneous schemas into a single view</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sources.map(src => {
          const isActive = activeSourceIds.includes(src.id);
          return (
            <div key={src.id} className={`rounded-xl p-3.5 border transition-all duration-300 ${isActive ? 'bg-indigo-950/20 border-indigo-500/20 text-slate-200 shadow-inner' : 'bg-secondary/10 border-border/40 text-slate-400 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">{src.name}</h4>
                  <div className="text-[9px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">{src.type}</div>
                </div>
                <Badge variant="outline" className={`font-bold text-[8px] px-1.5 py-0.5 rounded-md ${isActive ? 'border-primary/20 text-primary bg-primary/5' : 'border-slate-800 text-slate-500 bg-slate-900'}`}>
                  {src.trust}
                </Badge>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-2 leading-relaxed">{src.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
