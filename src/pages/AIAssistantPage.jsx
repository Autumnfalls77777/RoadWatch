import { useState, useRef, useEffect } from 'react';
import { Send, Zap, ArrowLeft, Mic, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_QUESTIONS = [
  'Who built MG Road, Bengaluru?',
  'Which roads in Mumbai have the worst health score?',
  'How many potholes were reported in Delhi this month?',
  'What is the budget allocated for NH48?',
  'Which contractor has the best reliability score?',
  'Show me all Critical complaints in Pune',
];

function generateAIResponse(question, complaints) {
  const q = question.toLowerCase();

  if (q.includes('mumbai') || q.includes('mumbai')) {
    return `Based on RoadWatch data, Mumbai currently has **${complaints.filter(c => c.district?.toLowerCase().includes('mumbai')).length || 'several'} active complaints**. The road health index for Mumbai stands at **55/100** (Moderate). Western Express Highway and Eastern Express Highway have the most reported issues this month.`;
  }
  if (q.includes('contractor') || q.includes('reliab') || q.includes('best')) {
    return `According to our contractor database, **RoadCraft Infrastructure** currently leads with a reliability score of **91/100**, followed by **ABC Infra (88/100)** and **SkyWay Builders (79/100)**. Rankings are updated in real-time based on complaint data and repair completion rates.`;
  }
  if (q.includes('budget') || q.includes('allocated') || q.includes('spending')) {
    return `RoadWatch is currently monitoring **₹840 Crore** in road maintenance budget across 12 states. Average utilization stands at **73%**. You can view detailed budget breakdowns for specific roads on the Road Details page.`;
  }
  if (q.includes('pothole') || q.includes('delhi')) {
    return `Delhi currently has **2,100 active complaints**, of which **487 are classified as potholes**. Critical potholes requiring immediate attention: **38**. The Ring Road and Outer Ring Road segments show the highest concentration. Response time has improved by 23% this quarter.`;
  }
  if (q.includes('nh48') || q.includes('nh') || q.includes('highway')) {
    return `National Highway 48 (Delhi–Mumbai corridor) has an allocated maintenance budget of **₹124 Crore** for FY 2024-25. Current road health score: **68/100**. Contractor: **NHAI-authorized consortium**. Last major repair: March 2024. There are currently 23 active complaints on this stretch.`;
  }
  if (q.includes('mg road') || q.includes('built') || q.includes('constructed')) {
    return `MG Road, Bengaluru was last reconstructed in **2019** under contract by **Bengaluru City Corporation (BBMP)** with contractor **L&T Infrastructure**. The road spans **4.2 km**, current health score is **71/100**. Total budget allocated: ₹38 Crore. 12 complaints filed in the last 90 days.`;
  }
  if (q.includes('critical') || q.includes('pune') || q.includes('worst')) {
    return `Pune currently has **${complaints.filter(c => c.severity === 'Critical').length || 12} critical complaints**. The areas with worst road conditions are: Kothrud Depot Road (score: 32), Hadapsar Industrial Estate Road (score: 28), and Kondhwa Road (score: 34). All three have active contractor assignments.`;
  }

  return `I found data related to your query. RoadWatch tracks **${complaints.length || '12,400+'} roads** across India. Currently monitoring **${complaints.length || '2.4M+'} complaints**, with a national road health index of **64/100**. 

For more specific information, you can:
- View the **Live Map** for real-time road conditions
- Check **Contractor Rankings** for contractor-specific data  
- Browse the **Complaint Board** for filtered issue searches

What specific information would you like to know?`;
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary text-white' : 'gradient-primary text-white'
      }`}>
        {isUser ? '👤' : <Zap className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-primary text-white rounded-tr-md'
          : 'bg-card border border-border/60 text-foreground rounded-tl-md'
      }`}>
        {isUser ? msg.content : (
          <div dangerouslySetInnerHTML={{
            __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
          }} />
        )}
        {msg.loading && (
          <div className="flex gap-1 mt-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm **RoadWatch AI**, your intelligent assistant for India's road infrastructure data. 🛣️

I can answer questions about:
- **Road health scores** and conditions
- **Who built or maintains** a specific road
- **Budget allocation** and spending
- **Contractor rankings** and performance
- **Complaint counts** and trends

What would you like to know?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.entities.Complaint.list('-created_date', 200).then(setComplaints).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    // Add loading message
    setMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    const response = generateAIResponse(question, complaints);

    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: 'assistant', content: response };
      return updated;
    });
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold font-sora">RoadWatch AI</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Online · Road data connected
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMessages([messages[0]])}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-2">Suggested questions:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-xl text-xs text-foreground transition-colors border border-border/40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Input
            placeholder="Ask about any road, contractor, or complaint..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="pr-12 bg-card rounded-2xl border-border/60"
          />
        </div>
        <Button
          className="gradient-primary border-0 text-white rounded-2xl w-11 h-11 p-0 flex-shrink-0"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}