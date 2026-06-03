import { motion } from 'framer-motion';

const LEVEL_CONFIGS = {
  2: { color: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🔍' },
  3: { color: 'from-teal-500 to-teal-600', badge: 'bg-teal-100 text-teal-800 border-teal-300', icon: '🗺️' },
  4: { color: 'from-orange-500 to-orange-600', badge: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🔧' },
  5: { color: 'from-indigo-500 to-indigo-600', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '🏛️' },
  6: { color: 'from-purple-500 to-purple-600', badge: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🌐' },
  7: { color: 'from-rose-500 to-rose-600', badge: 'bg-rose-100 text-rose-800 border-rose-300', icon: '⚙️' },
};

export default function AuthorityPageHeader({ role, title, subtitle, level }) {
  const cfg = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[2];

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-base shadow-sm`}>
          {cfg.icon}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          Level {level} · {role}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-sora">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
    </motion.div>
  );
}