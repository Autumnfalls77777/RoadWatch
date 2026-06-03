import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Map, BarChart2, Users, CheckCircle, ArrowRight, Star, Zap, Eye, Award, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const stats = [
  { value: '2.4M+', label: 'Reports Filed', color: 'text-blue-600' },
  { value: '89%', label: 'AI Accuracy', color: 'text-green-600' },
  { value: '12,400+', label: 'Roads Tracked', color: 'text-purple-600' },
  { value: '₹840Cr', label: 'Budget Monitored', color: 'text-orange-600' },
];

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Verification',
    desc: 'Our AI detects potholes, cracks, and road damage with 89% accuracy in under 30 seconds.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Map,
    title: 'Live Road Health Map',
    desc: 'Real-time heatmap showing road conditions across India. Filter by district, severity, and type.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Eye,
    title: 'Budget Transparency',
    desc: 'Every rupee of road budget is publicly visible. Track allocation, spending, and utilization.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Award,
    title: 'Contractor Rankings',
    desc: 'Public scorecards for every contractor. Reliability, satisfaction, and health scores.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Users,
    title: 'Community Validation',
    desc: 'Citizens verify each other\'s reports. 30+ upvotes auto-creates a Road Forum for discussion.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Activity,
    title: 'Road Health Engine',
    desc: 'Dynamic scoring based on complaints, repairs, age, traffic, and authority response time.',
    color: 'bg-cyan-50 text-cyan-600',
  },
];

const steps = [
  { step: '01', title: 'Spot & Snap', desc: 'Take a photo or video of a road issue with your phone.' },
  { step: '02', title: 'AI Analyzes', desc: 'Our AI verifies the defect, scores severity, and checks for duplicates.' },
  { step: '03', title: 'Community Validates', desc: 'Nearby citizens upvote and verify your complaint.' },
  { step: '04', title: 'Authority Acts', desc: 'Prioritized complaints reach the right authority automatically.' },
  { step: '05', title: 'Track Progress', desc: 'Follow your complaint from filing to resolution in real time.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Citizen, Bengaluru', text: 'I filed a pothole report at 9am. By evening, it was assigned to a contractor. This actually works!', rating: 5 },
  { name: 'Rajesh Kumar', role: 'District Engineer, Pune', text: 'RoadWatch reduced our complaint backlog by 60%. The AI prioritization is incredibly useful.', rating: 5 },
  { name: 'Anita Menon', role: 'Citizen, Chennai', text: 'For the first time I can see exactly how my tax money is being spent on roads. Incredible transparency.', rating: 5 },
];

export default function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-accent-foreground/20 text-accent-foreground text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Hackathon Project — AI-Powered Road Accountability
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold font-sora text-foreground leading-tight mb-6"
          >
            India's Roads.<br />
            <span className="gradient-text">Finally Accountable.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            AI-powered road monitoring where citizens report, communities validate, AI verifies, 
            and authorities are held accountable — all in one transparent platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Link to="/map">
              <Button size="lg" className="gradient-primary border-0 text-white shadow-lg w-full sm:w-auto gap-2">
                <Map className="w-4 h-4" />
                View Live Road Map
              </Button>
            </Link>
            <Link to="/report">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <AlertTriangle className="w-4 h-4" />
                Report a Road Issue
              </Button>
            </Link>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
                <div className={`text-2xl font-bold font-sora ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Road Health Snapshot */}
      <section className="py-16 px-4 sm:px-6 bg-card border-y border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-sora mb-2">Live Road Health Snapshot</h2>
            <p className="text-muted-foreground">Real-time conditions across major Indian cities</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { city: 'Mumbai', score: 62, complaints: 1240 },
              { city: 'Delhi', score: 54, complaints: 2100 },
              { city: 'Bengaluru', score: 71, complaints: 890 },
              { city: 'Chennai', score: 77, complaints: 560 },
              { city: 'Pune', score: 68, complaints: 720 },
              { city: 'Hyderabad', score: 73, complaints: 480 },
              { city: 'Kolkata', score: 49, complaints: 1560 },
              { city: 'Ahmedabad', score: 82, complaints: 320 },
            ].map((city, i) => {
              const color = city.score >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
                city.score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                city.score >= 40 ? 'text-orange-600 bg-orange-50 border-orange-200' :
                'text-red-600 bg-red-50 border-red-200';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-background rounded-xl border border-border/60 p-4"
                >
                  <div className="font-semibold text-sm mb-2">{city.city}</div>
                  <div className={`text-2xl font-bold font-sora ${color.split(' ')[0]}`}>{city.score}</div>
                  <div className="text-xs text-muted-foreground mt-1">{city.complaints.toLocaleString()} complaints</div>
                  <div className={`mt-2 h-1.5 rounded-full ${color.split(' ')[1]}`}>
                    <div className={`h-full rounded-full ${color.split(' ')[0].replace('text-', 'bg-')}`} style={{ width: `${city.score}%` }}></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-sora mb-3">A Complete Road Accountability Ecosystem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Not just pothole reporting. A full transparency and accountability platform for India's road infrastructure.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border/60 p-6 card-hover"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 bg-card border-y border-border/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-sora mb-3">How RoadWatch Works</h2>
            <p className="text-muted-foreground">From complaint to resolution in 5 transparent steps</p>
          </div>
          <div className="grid sm:grid-cols-5 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-1/2 w-full h-px bg-border"></div>
                )}
                <div className="relative w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
                <Award className="w-3 h-3" />
                Citizen Gamification
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sora mb-4">Earn Points.<br />Level Up. Change Roads.</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every verified report, community participation, and forum contribution earns you points. 
                Rise from Road Scout to Road Champion and shape your city's infrastructure.
              </p>
              <div className="space-y-3">
                {[
                  { level: 'Road Scout', points: '0–500', color: 'bg-gray-100 text-gray-700' },
                  { level: 'Road Reporter', points: '500–2K', color: 'bg-blue-100 text-blue-700' },
                  { level: 'Road Guardian', points: '2K–5K', color: 'bg-purple-100 text-purple-700' },
                  { level: 'Road Inspector', points: '5K–15K', color: 'bg-orange-100 text-orange-700' },
                  { level: 'Road Champion', points: '15K+', color: 'bg-yellow-100 text-yellow-700' },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/60">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${l.color}`}>L{i + 1}</span>
                    <span className="font-medium text-sm flex-1">{l.level}</span>
                    <span className="text-xs text-muted-foreground">{l.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border/60 p-5"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mb-3 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-sora text-white mb-4">
              Join 2.4 Million Citizens<br />Fixing India's Roads
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              One report can fix a road. One platform can fix the system.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/report">
                <Button size="lg" className="gradient-primary border-0 text-white w-full sm:w-auto gap-2">
                  Report Your First Issue <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                  Explore the Map
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground border-t border-white/10 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white font-sora">RoadWatch</span>
            </Link>
            <p className="text-white/40 text-sm text-center">
              Built for Hackathon Project · AI-Powered Road Accountability for India
            </p>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <Link to="/map" className="hover:text-white/80 transition-colors">Map</Link>
              <Link to="/complaints" className="hover:text-white/80 transition-colors">Complaints</Link>
              <Link to="/analytics" className="hover:text-white/80 transition-colors">Analytics</Link>
            </div>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}