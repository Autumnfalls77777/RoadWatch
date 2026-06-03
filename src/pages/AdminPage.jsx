import { useEffect, useState } from 'react';
import { Shield, Users, Building2, HardHat, AlertCircle, MessageSquare, Search, Plus, Trash2, Pin, Lock, UserX, CheckCircle, AlertTriangle, Cpu, Database, Upload, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import RoleGuard from '@/components/authority/RoleGuard';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roles = ['citizen', 'junior_officer', 'road_inspector', 'executive_engineer', 'district_authority', 'state_authority', 'contractor', 'admin', 'super_admin'];
const tabs = [
  ['datasets', Database, 'Dataset Manager'],
  ['users', Users, 'Users'],
  ['authorities', Building2, 'Authorities'],
  ['contractors', HardHat, 'Contractors'],
  ['complaints', AlertCircle, 'Complaints'],
  ['community', MessageSquare, 'Community'],
];

export default function AdminPage() {
  const [active, setActive] = useState('users');
  const [users, setUsers] = useState([]);
  const [roads, setRoads] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [wards, setWards] = useState([]);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [datasetVersion, setDatasetVersion] = useState('2026');
  
  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'junior_officer', assigned_area: '', assigned_roads: '', assigned_district: 'Pune', assigned_state: 'Maharashtra', status: 'active' });
  const [contractorForm, setContractorForm] = useState({ name: '', company_type: '', contact_details: '', assigned_roads: '', authority: '', contract_value: 0, allocated_budget: 0, spent_budget: 0, project_status: 'Active', start_date: '', completion_date: '', avg_health_score: 70, resolution_rate: 80, citizen_rating: 4, reliability_score: 80, projects_completed: 0, projects_active: 1 });
  const [authorityForm, setAuthorityForm] = useState({ name: '', shortName: '', type: 'Municipal', country: 'India', state: 'Maharashtra', district: 'Pune', accountability_score: 80, resolution_rate: 80, response_hours: 12, citizen_satisfaction: 80, open_complaints: 0, escalated_complaints: 0 });

  // Budget summary state
  const [budgetSummary, setBudgetSummary] = useState(null);

  const load = async () => {
    try {
      const [u, r, c, p, auths, posts, dataSets, wardList] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 200),
        base44.entities.Road.list('-created_date', 200),
        base44.entities.Contractor.list('-created_date', 200),
        base44.entities.Complaint.list('-created_date', 200),
        base44.entities.Authority.list('-created_date', 200),
        base44.entities.Forum.list('-created_date', 200),
        base44.entities.Dataset.list('-upload_date', 200),
        base44.entities.Ward.list('-updated_date', 200),
      ]);
      setUsers(u); 
      setRoads(r); 
      setContractors(c); 
      setComplaints(p);
      setAuthorities(auths);
      setForumPosts(posts);
      setDatasets(dataSets);
      setWards(wardList);

      // Fetch budget summary
      const res = await fetch('http://localhost:8787/api/budgets/summary');
      if (res.ok) {
        const data = await res.json();
        setBudgetSummary(data);
      }
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    }
  };

  useEffect(() => { load(); }, []);

  const ingestPmcDatasets = async () => {
    setUploading(true);
    try {
      const res = await fetch('http://localhost:8787/api/datasets/demo-ingest', { method: 'POST' });
      if (!res.ok) throw new Error('PMC ingestion failed');
      await load();
    } finally {
      setUploading(false);
    }
  };

  const uploadDataset = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const contentBase64 = await readFileAsDataUrl(file);
      const extension = file.name.split('.').pop().toLowerCase();
      const res = await fetch('http://localhost:8787/api/datasets/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: file.name, version: datasetVersion, extension, contentBase64 }),
      });
      if (!res.ok) throw new Error('Dataset upload failed');
      event.target.value = '';
      await load();
    } finally {
      setUploading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    await base44.entities.UserProfile.create({ ...userForm, assigned_roads: split(userForm.assigned_roads) });
    setUserForm({ ...userForm, name: '', email: '', password: '' });
    load();
  };

  const createContractor = async (e) => {
    e.preventDefault();
    await base44.entities.Contractor.create({
      ...contractorForm,
      assigned_roads: split(contractorForm.assigned_roads),
      projects_completed: Number(contractorForm.projects_completed),
      projects_active: Number(contractorForm.projects_active),
      allocated_budget: Number(contractorForm.allocated_budget),
      spent_budget: Number(contractorForm.spent_budget),
      avg_health_score: Number(contractorForm.avg_health_score),
      resolution_rate: Number(contractorForm.resolution_rate),
      citizen_rating: Number(contractorForm.citizen_rating),
      reliability_score: Number(contractorForm.reliability_score),
      repair_completion_rate: Number(contractorForm.resolution_rate),
    });
    setContractorForm({ ...contractorForm, name: '', company_type: '', contact_details: '' });
    load();
  };

  const createAuthority = async (e) => {
    e.preventDefault();
    await base44.entities.Authority.create({
      ...authorityForm,
      accountability_score: Number(authorityForm.accountability_score),
      resolution_rate: Number(authorityForm.resolution_rate),
      response_hours: Number(authorityForm.response_hours),
      citizen_satisfaction: Number(authorityForm.citizen_satisfaction),
      open_complaints: Number(authorityForm.open_complaints),
      escalated_complaints: Number(authorityForm.escalated_complaints),
      wards: [],
      roads: [],
    });
    setAuthorityForm({ ...authorityForm, name: '', shortName: '' });
    load();
  };

  const deleteAuthority = async (id) => {
    if (confirm('Are you sure you want to delete this authority?')) {
      await base44.entities.Authority.delete(id);
      load();
    }
  };

  const updateComplaint = async (complaint, updates) => {
    await base44.entities.Complaint.update(complaint.id, updates);
    load();
  };

  const assignComplaint = async (complaint, contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    await updateComplaint(complaint, { contractor_id: contractorId, contractor_name: contractor?.name, status: 'Assigned' });
  };

  const updateUserRole = async (userId, role) => {
    await base44.entities.UserProfile.update(userId, { role });
    load();
  };

  const updateUserStatus = async (userId, status) => {
    await base44.entities.UserProfile.update(userId, { status });
    load();
  };

  const togglePinForum = async (post) => {
    await base44.entities.Forum.update(post.id, { is_pinned: !post.is_pinned });
    load();
  };

  const toggleLockForum = async (post) => {
    await base44.entities.Forum.update(post.id, { is_locked: !post.is_locked });
    load();
  };

  const deleteForumPost = async (postId) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await base44.entities.Forum.delete(postId);
      load();
    }
  };

  // Workload calculator for contractors
  const getContractorWorkload = (conId) => {
    const activeCases = complaints.filter(c => c.contractor_id === conId && !['Resolved', 'completed', 'Completed'].includes(c.status)).length;
    const closedCases = complaints.filter(c => c.contractor_id === conId && ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
    return `${activeCases} active / ${closedCases} closed`;
  };

  const filteredUsers = users.filter(u => !query || `${u.name || u.display_name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase().includes(query.toLowerCase()));
  const filteredForumPosts = forumPosts.filter(p => !query || `${p.title || ''} ${p.road_name || ''} ${p.author_name || ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <RoleGuard allowedRoles={['admin', 'super_admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader title="Admin Control Panel" subtitle="Manage users, authorities, contractors, complaints, and community governance" badge="Admin" />

        {/* Budget summary card */}
        {budgetSummary && (
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/50 rounded-2xl border border-indigo-500/20 p-5 mb-6 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold tracking-wider text-indigo-400 uppercase mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Global Budget Summary (Transparencies)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-white">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Total Allocated</div>
                <div className="text-lg font-bold">₹{(budgetSummary.total_allocated / 10000000).toFixed(2)} Cr</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Total Spent</div>
                <div className="text-lg font-bold text-emerald-400">₹{(budgetSummary.total_spent / 10000000).toFixed(2)} Cr</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-xs text-slate-400">Remaining Balance</div>
                <div className="text-lg font-bold text-cyan-400">₹{(budgetSummary.total_remaining / 10000000).toFixed(2)} Cr</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 col-span-2 md:col-span-1">
                <div className="text-xs text-slate-400">Total Contractors</div>
                <div className="text-lg font-bold">{budgetSummary.contractor_breakdown?.length || 0} active</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {tabs.map(([id, Icon, label]) => (
            <button key={id} onClick={() => setActive(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${active === id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card border-border/60 text-muted-foreground hover:bg-secondary/40'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {active === 'users' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <form onSubmit={createUser} className="bg-card rounded-2xl border border-border/60 p-5 space-y-3 shadow-md">
              <h2 className="font-bold flex items-center gap-2 text-foreground"><Plus className="w-4 h-4" /> Create Authority Account</h2>
              <Input placeholder="Name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
              <Input placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
              <Input placeholder="Password" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">User Role</label>
                <Select value={userForm.role} onValueChange={role => setUserForm({ ...userForm, role })}>
                  <SelectTrigger className="w-full text-foreground bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-popover-foreground">
                    {roles.map(r => <SelectItem key={r} value={r} className="text-foreground hover:bg-secondary cursor-pointer">{label(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Assigned Area" value={userForm.assigned_area} onChange={e => setUserForm({ ...userForm, assigned_area: e.target.value })} />
              <Input placeholder="Assigned Roads (comma separated IDs)" value={userForm.assigned_roads} onChange={e => setUserForm({ ...userForm, assigned_roads: e.target.value })} />
              <Input placeholder="Assigned District" value={userForm.assigned_district} onChange={e => setUserForm({ ...userForm, assigned_district: e.target.value })} />
              <Input placeholder="Assigned State" value={userForm.assigned_state} onChange={e => setUserForm({ ...userForm, assigned_state: e.target.value })} />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Account Status</label>
                <Select value={userForm.status} onValueChange={status => setUserForm({ ...userForm, status })}>
                  <SelectTrigger className="w-full text-foreground bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-popover-foreground">
                    {['active', 'suspended', 'pending'].map(s => <SelectItem key={s} value={s} className="text-foreground hover:bg-secondary cursor-pointer">{label(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-primary border-0 text-white mt-4">Create Account</Button>
            </form>
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-md">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search users..." value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <div key={u.id} className="rounded-xl border border-border/50 bg-secondary/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-foreground">
                    <div>
                      <div className="font-bold text-foreground text-sm">{u.name || u.display_name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">Area: {u.assigned_area || 'Global'} | District: {u.assigned_district}</div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={u.role} onValueChange={(role) => updateUserRole(u.id, role)}>
                        <SelectTrigger className="h-8 w-36 text-xs text-foreground bg-background"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                          {roles.map(r => <SelectItem key={r} value={r} className="text-foreground hover:bg-secondary text-xs cursor-pointer">{label(r)}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={u.status} onValueChange={(status) => updateUserStatus(u.id, status)}>
                        <SelectTrigger className="h-8 w-28 text-xs text-foreground bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                          {['active', 'suspended', 'pending'].map(s => <SelectItem key={s} value={s} className="text-foreground hover:bg-secondary text-xs cursor-pointer">{label(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Button size="sm" variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400 h-8" onClick={() => base44.entities.UserProfile.update(u.id, { status: 'suspended' }).then(load)}>
                        <UserX className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400 h-8" onClick={() => base44.entities.UserProfile.delete(u.id).then(load)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 'datasets' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md space-y-4">
                <div>
                  <h2 className="font-bold flex items-center gap-2 text-foreground"><Upload className="w-4 h-4" /> Upload Dataset</h2>
                  <p className="text-xs text-muted-foreground mt-1">CSV, XLS, and XLSX files are parsed into cities, wards, roads, and road metadata.</p>
                </div>
                <Input placeholder="Dataset Version" value={datasetVersion} onChange={e => setDatasetVersion(e.target.value)} />
                <Input type="file" accept=".csv,.xls,.xlsx" onChange={uploadDataset} disabled={uploading} />
                <Button type="button" onClick={ingestPmcDatasets} disabled={uploading} className="w-full gradient-primary border-0 text-white gap-2">
                  <RefreshCw className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
                  Ingest PMC Road Datasets
                </Button>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Datasets', datasets.length],
                  ['Cities', new Set(roads.map(r => r.city).filter(Boolean)).size],
                  ['Wards', wards.length],
                  ['Road Records', roads.length],
                ].map(([labelText, value]) => (
                  <div key={labelText} className="bg-card rounded-2xl border border-border/60 p-4 shadow-md">
                    <div className="text-xs text-muted-foreground font-bold uppercase">{labelText}</div>
                    <div className="text-2xl font-black text-foreground mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-foreground"><Database className="w-4 h-4" /> Dataset Records</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 px-2">Dataset Name</th>
                      <th className="py-2 px-2">Version</th>
                      <th className="py-2 px-2">City</th>
                      <th className="py-2 px-2">Upload Date</th>
                      <th className="py-2 px-2 text-center">Rows</th>
                      <th className="py-2 px-2 text-center">Generated</th>
                      <th className="py-2 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map(ds => (
                      <tr key={ds.id} className="border-b border-border/40">
                        <td className="py-3 px-2 font-semibold text-foreground">{ds.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{ds.version}</td>
                        <td className="py-3 px-2 text-muted-foreground">{ds.city || '-'}</td>
                        <td className="py-3 px-2 text-muted-foreground">{ds.upload_date ? new Date(ds.upload_date).toLocaleString('en-IN') : '-'}</td>
                        <td className="py-3 px-2 text-center text-foreground">{ds.rows_processed || 0}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground">
                          {(ds.generated?.cities || 0)} cities / {(ds.generated?.wards || 0)} wards / {(ds.generated?.roads || 0)} roads
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2.5 py-1 rounded-full font-bold border ${ds.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ds.status === 'Failed' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                            {ds.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {datasets.length === 0 && (
                      <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">No datasets ingested yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === 'authorities' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <form onSubmit={createAuthority} className="bg-card rounded-2xl border border-border/60 p-5 space-y-3 shadow-md">
              <h2 className="font-bold flex items-center gap-2 text-foreground"><Plus className="w-4 h-4" /> Add New Authority</h2>
              <Input placeholder="Authority Name (e.g. PMC Road Dept)" value={authorityForm.name} onChange={e => setAuthorityForm({ ...authorityForm, name: e.target.value })} required />
              <Input placeholder="Short Name (e.g. PMC)" value={authorityForm.shortName} onChange={e => setAuthorityForm({ ...authorityForm, shortName: e.target.value })} required />
              <Select value={authorityForm.type} onValueChange={type => setAuthorityForm({ ...authorityForm, type })}>
                <SelectTrigger className="w-full text-foreground bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border border-border text-popover-foreground">
                  {['Municipal', 'National', 'Metropolitan', 'Government', 'State'].map(t => <SelectItem key={t} value={t} className="text-foreground hover:bg-secondary cursor-pointer">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Country" value={authorityForm.country} onChange={e => setAuthorityForm({ ...authorityForm, country: e.target.value })} required />
              <Input placeholder="State" value={authorityForm.state} onChange={e => setAuthorityForm({ ...authorityForm, state: e.target.value })} required />
              <Input placeholder="District" value={authorityForm.district} onChange={e => setAuthorityForm({ ...authorityForm, district: e.target.value })} required />
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold">Accountability Score</label>
                  <Input type="number" value={authorityForm.accountability_score} onChange={e => setAuthorityForm({ ...authorityForm, accountability_score: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold">Response Hours (avg)</label>
                  <Input type="number" value={authorityForm.response_hours} onChange={e => setAuthorityForm({ ...authorityForm, response_hours: e.target.value })} />
                </div>
              </div>
              <Button className="w-full gradient-primary border-0 text-white mt-4">Add Authority</Button>
            </form>
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-md">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-foreground"><Shield className="w-4 h-4" /> Authority Records</h2>
              <div className="space-y-3">
                {authorities.map(auth => (
                  <div key={auth.id} className="rounded-xl border border-border/50 bg-secondary/10 p-4 flex items-center justify-between text-foreground">
                    <div>
                      <div className="font-bold text-foreground text-sm">{auth.name} ({auth.shortName})</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Jurisdiction: {auth.district}, {auth.state}, {auth.country}</div>
                      <div className="flex gap-4 mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        <span>Score: {auth.accountability_score}/100</span>
                        <span>Avg Response: {auth.response_hours} hrs</span>
                        <span>Citizen Rating: {auth.citizen_satisfaction}%</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400" onClick={() => deleteAuthority(auth.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 'contractors' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <form onSubmit={createContractor} className="bg-card rounded-2xl border border-border/60 p-5 space-y-3 shadow-md">
              <h2 className="font-bold flex items-center gap-2 text-foreground"><Plus className="w-4 h-4" /> Contractor Creation Form</h2>
              {['name', 'company_type', 'contact_details', 'assigned_roads', 'authority', 'project_status', 'start_date', 'completion_date'].map(k => (
                <Input key={k} placeholder={label(k)} value={contractorForm[k]} onChange={e => setContractorForm({ ...contractorForm, [k]: e.target.value })} />
              ))}
              {['contract_value', 'allocated_budget', 'spent_budget', 'avg_health_score', 'resolution_rate', 'citizen_rating', 'reliability_score', 'projects_completed', 'projects_active'].map(k => (
                <Input key={k} type="number" placeholder={label(k)} value={contractorForm[k]} onChange={e => setContractorForm({ ...contractorForm, [k]: e.target.value })} />
              ))}
              <Button className="w-full gradient-primary border-0 text-white mt-4">Create Contractor</Button>
            </form>
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-md">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-foreground"><Shield className="w-4 h-4" /> Contractor Records</h2>
              <div className="space-y-3">
                {contractors.map(con => (
                  <div key={con.id} className="rounded-xl border border-border/50 bg-secondary/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground">
                    <div>
                      <div className="font-bold text-foreground text-sm">{con.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{con.company_type} | Contact: {con.contact_details}</div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold text-foreground">
                        <span>Projects: {con.projects_active} active / {con.projects_completed} done</span>
                        <span className="text-emerald-600 dark:text-emerald-400">Budget: ₹{(con.allocated_budget / 10000000).toFixed(2)} Cr</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Workload: {getContractorWorkload(con.id)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400 self-start sm:self-center" onClick={() => base44.entities.Contractor.delete(con.id).then(load)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 'complaints' && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-foreground"><Shield className="w-4 h-4" /> Citizen Complaint Operations</h2>
            <div className="space-y-4">
              {complaints.map(c => (
                <div key={c.id} className="rounded-xl border border-border/60 bg-secondary/15 p-4 space-y-3 text-foreground animate-none">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground text-base flex items-center gap-2">
                        {c.title}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${c.severity === 'Critical' ? 'bg-red-500/20 text-red-600' : c.severity === 'High' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-500/20 text-slate-500'}`}>
                          {c.severity}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{c.location_text}</div>
                      <p className="text-xs text-foreground mt-2 italic">"{c.description}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold border ${c.status === 'Resolved' || c.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : c.status === 'In Progress' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600' : 'bg-slate-500/10 border-slate-500/30 text-slate-500'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* AI Analysis Details */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-500/10 p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">AI Findings:</span>{' '}
                        {c.detected_issue_type || 'Unknown'} detected ({Math.round((c.ai_confidence || 0.8) * 100)}% confidence).{' '}
                        <span className="text-muted-foreground">Status: {c.ai_verification_status || 'Verified'}. Duplicates: {c.duplicate_count || 0}.</span>
                      </div>
                    </div>
                    {c.severity_prediction && (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/5 px-2.5 py-0.5 rounded-lg border border-rose-500/10 self-start md:self-auto">
                        <AlertTriangle className="w-3.5 h-3.5" /> Severity Prediction: {c.severity_prediction}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
                    {['Approved', 'Rejected', 'On Hold', 'Escalated', 'Resolved'].map(status => (
                      <Button key={status} size="sm" variant="outline" className={`h-8 text-xs ${c.status === status ? 'bg-primary border-primary text-white hover:bg-primary/95' : 'hover:bg-secondary text-foreground'}`} onClick={() => updateComplaint(c, { status })}>
                        {status}
                      </Button>
                    ))}
                    
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground">Assign Contractor:</span>
                      <Select value={c.contractor_id || ''} onValueChange={id => assignComplaint(c, id)}>
                        <SelectTrigger className="h-8 w-52 text-xs bg-background text-foreground border-border">
                          <SelectValue placeholder="Select contractor" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                          {contractors.map(k => (
                            <SelectItem key={k.id} value={k.id} className="text-foreground hover:bg-secondary text-xs cursor-pointer">
                              {k.name} ({getContractorWorkload(k.id)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'community' && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-bold flex items-center gap-2 text-foreground"><MessageSquare className="w-4 h-4" /> Community Governance Logs</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10 h-9" placeholder="Search discussions..." value={query} onChange={e => setQuery(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              {filteredForumPosts.map(post => (
                <div key={post.id} className="rounded-xl border border-border/60 bg-secondary/10 p-4 space-y-2 text-foreground">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
                        {post.title}
                        {post.is_pinned && <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-indigo-500/20"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                        {post.is_locked && <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-red-500/20"><Lock className="w-2.5 h-2.5" /> Locked</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Author: {post.author_name} | Road: {post.road_name} ({post.road_code || '-'})</div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant={post.is_pinned ? 'default' : 'outline'} className="h-8 px-2.5" onClick={() => togglePinForum(post)}>
                        <Pin className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant={post.is_locked ? 'default' : 'outline'} className="h-8 px-2.5" onClick={() => toggleLockForum(post)}>
                        <Lock className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2.5 border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => deleteForumPost(post.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2 mt-1">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function split(value) { return String(value || '').split(',').map(v => v.trim()).filter(Boolean); }
function label(value) { return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
