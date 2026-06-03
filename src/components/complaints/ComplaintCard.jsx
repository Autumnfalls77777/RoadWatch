import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, CheckCircle, Clock, Camera, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import { formatDistanceToNow } from 'date-fns';

const categoryIcons = {
  Pothole: '🕳️',
  Crack: '💔',
  Waterlogging: '💧',
  'Broken Road': '🚧',
  'Missing Signage': '🚦',
  'Unsafe Construction': '⚠️',
  'Drainage Issue': '🌊',
  Other: '📍',
};

export default function ComplaintCard({ complaint, index = 0 }) {
  const timeAgo = complaint.created_date
    ? formatDistanceToNow(new Date(complaint.created_date), { addSuffix: true })
    : 'Recently';
  const aiScore = complaint.ai_confidence > 1 ? complaint.ai_confidence : Math.round((complaint.ai_confidence || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/complaints/${complaint.id}`}>
        <div className="bg-card rounded-2xl border border-border/60 p-4 card-hover">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              {categoryIcons[complaint.category] || '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
                  {complaint.title}
                </h3>
                <SeverityBadge severity={complaint.severity} />
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{complaint.location_text || complaint.district || 'Location not set'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {complaint.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {complaint.description}
            </p>
          )}

          {/* AI Badge */}
          {complaint.ai_confidence && (
            <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-purple-50 rounded-lg border border-purple-100 w-fit">
              <Zap className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">
                {complaint.ai_verification_status || 'AI Verified'} · {complaint.detected_issue_type || complaint.category} · {aiScore}%
              </span>
            </div>
          )}

          {/* Authority Routing Chain */}
          <div className="flex items-center gap-1.5 py-2 px-2.5 bg-secondary/30 rounded-xl mb-3 text-[10px] text-muted-foreground border border-border/30 overflow-hidden w-full flex-wrap">
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-primary mr-1">Agency Route:</span>
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {complaint.location_text?.split(',')[0] || 'Pune Road'}
            </span>
            <span>→</span>
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {complaint.ward?.split(' Ward')[0] || 'Shivajinagar'} Ward
            </span>
            <span>→</span>
            <span className="font-semibold text-foreground truncate max-w-[160px]">
              {complaint.authority?.split(' Department')[0] || 'PMC Road Dept'}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{complaint.upvote_count || complaint.upvotes || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{complaint.verification_count || complaint.verified_count || 0} verified</span>
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {complaint.community_confidence_score || 0}% confidence
              </span>
              {complaint.media_urls?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{complaint.media_urls.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={complaint.status} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
