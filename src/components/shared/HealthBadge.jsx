export function getHealthColor(score) {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Excellent', dot: 'bg-green-500' };
  if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Moderate', dot: 'bg-yellow-500' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Poor', dot: 'bg-orange-500' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical', dot: 'bg-red-500' };
}

export function getSeverityColor(severity) {
  const map = {
    Low: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    Medium: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    High: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    Critical: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };
  return map[severity] || map.Medium;
}

export function getStatusColor(status) {
  const map = {
    Submitted: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'AI Verified': { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    'Under Review': { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    Assigned: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    'In Progress': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    Resolved: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    Rejected: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };
  return map[status] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
}

export default function HealthBadge({ score, size = 'sm' }) {
  const colors = getHealthColor(score);
  const textSize = size === 'lg' ? 'text-base' : 'text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${textSize} ${colors.text} ${colors.bg} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {colors.label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const colors = getSeverityColor(severity);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.text} ${colors.bg} ${colors.border}`}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.text} ${colors.bg} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('50', '500')}`}></span>
      {status}
    </span>
  );
}

export function RoadHealthScore({ score, size = 'md' }) {
  const colors = getHealthColor(score);
  const sizes = {
    sm: 'text-lg w-12 h-12',
    md: 'text-2xl w-16 h-16',
    lg: 'text-4xl w-24 h-24',
  };
  return (
    <div className={`relative flex items-center justify-center rounded-full border-4 font-bold font-sora ${sizes[size]} ${colors.text} ${colors.border} ${colors.bg}`}>
      {score}
    </div>
  );
}