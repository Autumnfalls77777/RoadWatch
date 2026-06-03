import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ThumbsUp, CheckCircle, Clock, ArrowLeft, Camera, Zap, User, MessageSquare, Share2, Shield, CopyCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import SkeletonCard from '@/components/shared/SkeletonCard';

export default function ComplaintDetailPage() {
  const { complaintId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [validatedType, setValidatedType] = useState('');
  const [validating, setValidating] = useState('');

  useEffect(() => {
    base44.entities.Complaint.list('-created_date', 100)
      .then(data => {
        const found = data.find(c => c.id === complaintId);
        setComplaint(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [complaintId]);

  useEffect(() => {
    if (user?.id) {
      const upvotes = JSON.parse(localStorage.getItem(`rw_upvotes_${user.id}`) || '[]');
      setUpvoted(upvotes.includes(complaintId));
      
      const validations = JSON.parse(localStorage.getItem(`rw_validations_${user.id}`) || '{}');
      setValidatedType(validations[complaintId] || '');
    } else {
      setUpvoted(false);
      setValidatedType('');
    }
  }, [complaintId, user]);

  const handleUpvote = async () => {
    if (!isAuthenticated || !user) {
      alert("You must be logged in to upvote reports.");
      return;
    }
    if (upvoted || upvoting) return;
    setUpvoting(true);
    try {
      await base44.entities.Complaint.update(complaintId, {
        upvote_count: (complaint.upvote_count || complaint.upvotes || 0) + 1,
      });
      setComplaint(prev => ({ ...prev, upvote_count: (prev.upvote_count || prev.upvotes || 0) + 1 }));
      setUpvoted(true);
      
      const upvotes = JSON.parse(localStorage.getItem(`rw_upvotes_${user.id}`) || '[]');
      if (!upvotes.includes(complaintId)) {
        upvotes.push(complaintId);
        localStorage.setItem(`rw_upvotes_${user.id}`, JSON.stringify(upvotes));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpvoting(false);
    }
  };

  const handleValidation = async (type) => {
    if (!isAuthenticated || !user) {
      alert("You must be logged in to validate reports.");
      return;
    }
    if (validatedType || validating) return;
    setValidating(type);
    const currentVerified = complaint.verification_count || complaint.verified_count || 0;
    const updatesByType = {
      verify: { verification_count: currentVerified + 1, verification_status: 'Verified by Community' },
      duplicate: { duplicate_count: (complaint.duplicate_count || 0) + 1, verification_status: 'Duplicate Report' },
      confirm: { confirm_count: (complaint.confirm_count || 0) + 1, verification_status: 'Verified by Community' },
      incorrect: { incorrect_count: (complaint.incorrect_count || 0) + 1, verification_status: 'Under Review' },
    };
    const next = updatesByType[type];
    const positive = (next.verification_count || currentVerified) + (next.confirm_count || complaint.confirm_count || 0);
    const total = positive + (next.duplicate_count || complaint.duplicate_count || 0) + (next.incorrect_count || complaint.incorrect_count || 0);
    try {
      const updated = await base44.entities.Complaint.update(complaintId, {
        ...next,
        community_confidence_score: total ? Math.round((positive / total) * 100) : complaint.community_confidence_score || 0,
      });
      setComplaint(prev => ({ ...prev, ...updated }));
      setValidatedType(type);
      
      const validations = JSON.parse(localStorage.getItem(`rw_validations_${user.id}`) || '{}');
      validations[complaintId] = type;
      localStorage.setItem(`rw_validations_${user.id}`, JSON.stringify(validations));
    } finally {
      setValidating('');
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><SkeletonCard lines={5} /><SkeletonCard lines={3} /></div>;

  if (!complaint) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">😕</div>
      <h2 className="text-xl font-semibold mb-2">Complaint not found</h2>
      <Link to="/complaints"><Button variant="outline">Back to Complaints</Button></Link>
    </div>
  );

  const timeAgo = complaint.created_date ? formatDistanceToNow(new Date(complaint.created_date), { addSuffix: true }) : '';
  const formattedDate = complaint.created_date ? format(new Date(complaint.created_date), 'dd MMM yyyy, h:mm a') : '';
  const aiScore = complaint.ai_confidence > 1 ? complaint.ai_confidence : Math.round((complaint.ai_confidence || 0) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <Link to="/complaints" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Complaints
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header Card */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={complaint.severity} />
              <StatusBadge status={complaint.status} />
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <h1 className="text-xl font-bold font-sora text-foreground mb-2">{complaint.title}</h1>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{complaint.location_text || `${complaint.district}, ${complaint.state}` || 'Location not specified'}</span>
          </div>

          {complaint.description && (
            <p className="text-sm text-foreground leading-relaxed mb-4 p-3 bg-secondary/50 rounded-xl">
              {complaint.description}
            </p>
          )}

          {/* Category chip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
              {complaint.category}
            </span>
            {complaint.road_name && (
              <span className="px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                📍 {complaint.road_name}
              </span>
            )}
          </div>
        </div>

        {/* Authority Routing Chain */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Authority Routing Chain</h2>
          </div>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
            <div className="relative">
              <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Geo-Tagged Road</div>
              <div className="font-bold text-sm text-foreground">{complaint.location_text?.split(',')[0] || 'Fergusson College (FC) Road'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10"></div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">PMC Pilot Ward Office</div>
              <div className="font-bold text-sm text-foreground">{complaint.ward || 'Shivajinagar-Ghole Road Ward Office'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-500/10"></div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Responsible Governance Agency</div>
              <div className="font-bold text-sm text-foreground">{complaint.authority || 'Pune Municipal Corporation Road Department'}</div>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        {complaint.ai_confidence && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-sm text-purple-900">AI Analysis Complete</div>
                <div className="text-xs text-purple-600">Processed by RoadWatch AI</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-white rounded-xl">
                <div className="text-lg font-bold text-purple-700">{aiScore}%</div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center p-2 bg-white rounded-xl">
                <div className="text-lg font-bold text-orange-600">{complaint.severity_prediction || complaint.severity}</div>
                <div className="text-xs text-muted-foreground">Severity</div>
              </div>
              <div className="text-center p-2 bg-white rounded-xl">
                <div className="text-xs font-semibold text-green-700 leading-tight">{complaint.detected_issue_type || complaint.ai_defect_type || complaint.category}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Defect Type</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-700 font-semibold">{complaint.ai_verification_status || 'AI Verified'}</div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Community Validation</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="text-xl font-bold font-sora">{complaint.verification_count || complaint.verified_count || 0}</div>
              <div className="text-xs text-muted-foreground">Verifications</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="text-xl font-bold font-sora">{complaint.community_confidence_score || 0}%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="text-xs font-bold text-primary leading-tight">{complaint.verification_status || 'Under Review'}</div>
              <div className="text-xs text-muted-foreground mt-1">Status</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button 
              variant={validatedType === 'verify' ? 'default' : 'outline'} 
              className={`gap-2 text-xs ${validatedType === 'verify' ? 'bg-green-600 hover:bg-green-700 text-white border-0' : ''}`}
              onClick={() => handleValidation('verify')} 
              disabled={!!validating || !!validatedType}
            >
              <CheckCircle className="w-4 h-4" /> 
              {validatedType === 'verify' ? 'Verified!' : 'Verify Report'}
            </Button>
            <Button 
              variant={validatedType === 'duplicate' ? 'default' : 'outline'} 
              className={`gap-2 text-xs ${validatedType === 'duplicate' ? 'bg-amber-600 hover:bg-amber-700 text-white border-0' : ''}`}
              onClick={() => handleValidation('duplicate')} 
              disabled={!!validating || !!validatedType}
            >
              <CopyCheck className="w-4 h-4" /> 
              {validatedType === 'duplicate' ? 'Duplicated!' : 'Duplicate'}
            </Button>
            <Button 
              variant={validatedType === 'confirm' ? 'default' : 'outline'} 
              className={`gap-2 text-xs ${validatedType === 'confirm' ? 'bg-blue-600 hover:bg-blue-700 text-white border-0' : ''}`}
              onClick={() => handleValidation('confirm')} 
              disabled={!!validating || !!validatedType}
            >
              <ThumbsUp className="w-4 h-4" /> 
              {validatedType === 'confirm' ? 'Confirmed!' : 'Confirm Issue'}
            </Button>
            <Button 
              variant={validatedType === 'incorrect' ? 'default' : 'outline'} 
              className={`gap-2 text-xs ${validatedType === 'incorrect' ? 'bg-red-600 hover:bg-red-700 text-white border-0' : ''}`}
              onClick={() => handleValidation('incorrect')} 
              disabled={!!validating || !!validatedType}
            >
              <AlertTriangle className="w-4 h-4" /> 
              {validatedType === 'incorrect' ? 'Flagged!' : 'Flag Incorrect'}
            </Button>
          </div>
        </div>

        {/* Media */}
        {complaint.media_urls?.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Photos & Media</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {complaint.media_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-32 object-cover rounded-xl border border-border/60"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats & Actions */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-sora text-foreground">{complaint.upvote_count || complaint.upvotes || 0}</div>
              <div className="text-xs text-muted-foreground">Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-sora text-foreground">{complaint.verification_count || complaint.verified_count || 0}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-sora text-foreground">{complaint.ai_confidence ? `${aiScore}%` : '—'}</div>
              <div className="text-xs text-muted-foreground">AI Score</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className={`flex-1 gap-2 transition-all ${upvoted ? 'bg-green-600 text-white' : ''}`}
              variant={upvoted ? 'default' : 'outline'}
              onClick={handleUpvote}
              disabled={upvoted || upvoting}
            >
              <ThumbsUp className="w-4 h-4" />
              {upvoted ? 'Upvoted!' : `Upvote (${complaint.upvote_count || complaint.upvotes || 0})`}
            </Button>
            <Button 
              variant={validatedType === 'verify' ? 'default' : 'outline'} 
              className={`flex-1 gap-2 ${validatedType === 'verify' ? 'bg-green-600 hover:bg-green-700 text-white border-0' : ''}`}
              onClick={() => handleValidation('verify')} 
              disabled={!!validating || !!validatedType}
            >
              <CheckCircle className="w-4 h-4" />
              {validatedType === 'verify' ? 'Verified!' : 'Verify'}
            </Button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="bg-card rounded-2xl border border-border/60 p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Reporter</span>
              <span className="font-medium">{complaint.reporter_name || 'Anonymous Citizen'}</span>
            </div>
            {complaint.reporter_level && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level</span>
                <span className="px-2.5 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-medium">{complaint.reporter_level}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Filed</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            {complaint.assigned_officer && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned To</span>
                <span className="font-medium">{complaint.assigned_officer}</span>
              </div>
            )}
          </div>

          {complaint.forum_created && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/forums">
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="w-4 h-4" />
                  View Road Forum Discussion
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
