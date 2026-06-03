// Mock API Client - replaces BASE44 SDK
// Provides mock data for development

const API_BASE = import.meta.env.VITE_ROADWATCH_API_URL || 'http://localhost:8787/api';
const apiEntityMap = {
  Complaint: 'complaints',
  Road: 'roads',
  Contractor: 'contractors',
  Authority: 'authorities',
  Forum: 'forums',
  ForumPost: 'forums',
  Notification: 'notifications',
  UserProfile: 'users',
  RoadTimeline: 'repairs',
  Dataset: 'datasets',
  City: 'cities',
  Ward: 'wards',
};

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('mock_auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const mockUsers = new Map();
const mockComplaints = [];

export const mockRoads = [
  {
    id: 'pune_road_001',
    name: 'Jangali Maharaj (JM) Road',
    road_code: 'PMC-URB-01',
    road_type: 'Urban Street',
    ward: 'Shivajinagar-Ghole Road Ward Office',
    authority_name: 'Pune Municipal Corporation Road Department',
    last_repair_date: '2026-02-15T00:00:00.000Z',
    construction_date: '2022-04-10T00:00:00.000Z',
    status: 'Excellent',
    length_km: 1.8,
    health_score: 89,
    total_complaints: 2,
    active_complaints: 0,
    contractor_id: 'con_001',
    contractor_name: 'PMC Infrastructure Ltd.',
    allocated_budget: 24000000, // ₹2.4 Crore
    spent_budget: 18000000,     // ₹1.8 Crore
    budget_remaining: 6000000,  // ₹60 Lakh
    funding_source: 'PMC Capital Works Fund',
    traffic_density: 'High',
    coordinates: [
      [18.5185, 73.8543],
      [18.5202, 73.8517],
      [18.5218, 73.8495],
      [18.5235, 73.8468]
    ]
  },
  {
    id: 'pune_road_002',
    name: 'Fergusson College (FC) Road',
    road_code: 'PMC-URB-02',
    road_type: 'Urban Street',
    ward: 'Shivajinagar-Ghole Road Ward Office',
    authority_name: 'Pune Municipal Corporation Road Department',
    last_repair_date: '2025-11-20T00:00:00.000Z',
    construction_date: '2021-08-15T00:00:00.000Z',
    status: 'Poor',
    length_km: 2.1,
    health_score: 46,
    total_complaints: 14,
    active_complaints: 8,
    contractor_id: 'con_002',
    contractor_name: 'Maharashtra Road Builders (MRB)',
    allocated_budget: 18000000, // ₹1.8 Crore
    spent_budget: 14500000,     // ₹1.45 Crore
    budget_remaining: 3500000,  // ₹35 Lakh
    funding_source: 'Pune Smart City Grant',
    traffic_density: 'Very High',
    coordinates: [
      [18.5205, 73.8452],
      [18.5235, 73.8445],
      [18.5255, 73.8436],
      [18.5285, 73.8415]
    ]
  },
  {
    id: 'pune_road_003',
    name: 'Senapati Bapat (SB) Road',
    road_code: 'PMC-URB-03',
    road_type: 'Urban Arterial',
    ward: 'Shivajinagar-Ghole Road Ward Office',
    authority_name: 'Pune Municipal Corporation Road Department',
    last_repair_date: '2026-03-05T00:00:00.000Z',
    construction_date: '2023-01-20T00:00:00.000Z',
    status: 'Good',
    length_km: 2.5,
    health_score: 72,
    total_complaints: 5,
    active_complaints: 2,
    contractor_id: 'con_003',
    contractor_name: 'Pune Smartways & Co.',
    allocated_budget: 31000000, // ₹3.1 Crore
    spent_budget: 27000000,     // ₹2.7 Crore
    budget_remaining: 4000000,  // ₹40 Lakh
    funding_source: 'State Infrastructure Fund',
    traffic_density: 'High',
    coordinates: [
      [18.5265, 73.8375],
      [18.5305, 73.8325],
      [18.5345, 73.8285]
    ]
  },
  {
    id: 'pune_road_004',
    name: 'Karve Road (Nal Stop Segment)',
    road_code: 'PMC-MDR-01',
    road_type: 'Major District Road',
    ward: 'Kothrud-Bawdhan Ward Office',
    authority_name: 'Pune Metropolitan Region Development Authority',
    last_repair_date: '2025-05-12T00:00:00.000Z',
    construction_date: '2019-11-10T00:00:00.000Z',
    status: 'Closed',
    length_km: 3.4,
    health_score: 28,
    total_complaints: 29,
    active_complaints: 17,
    contractor_id: 'con_004',
    contractor_name: 'Western India Highways Ltd.',
    allocated_budget: 45000000, // ₹4.5 Crore
    spent_budget: 41000000,     // ₹4.1 Crore
    budget_remaining: 4000000,  // ₹40 Lakh
    funding_source: 'National Highway Authority Aid',
    traffic_density: 'Extreme',
    coordinates: [
      [18.5135, 73.8425],
      [18.5095, 73.8325],
      [18.5055, 73.8215]
    ]
  },
  {
    id: 'pune_road_005',
    name: 'Baner Road (Aundh-Baner link)',
    road_code: 'PMC-URB-04',
    road_type: 'Urban Street',
    ward: 'Aundh-Baner Ward Office',
    authority_name: 'Pune Municipal Corporation Road Department',
    last_repair_date: '2026-01-10T00:00:00.000Z',
    construction_date: '2023-09-05T00:00:00.000Z',
    status: 'Good',
    length_km: 4.2,
    health_score: 78,
    total_complaints: 6,
    active_complaints: 1,
    contractor_id: 'con_001',
    contractor_name: 'PMC Infrastructure Ltd.',
    allocated_budget: 38000000, // ₹3.8 Crore
    spent_budget: 29000000,     // ₹2.9 Crore
    budget_remaining: 9000000,  // ₹90 Lakh
    funding_source: 'PMC Capital Works Fund',
    traffic_density: 'Medium',
    coordinates: [
      [18.5395, 73.8205],
      [18.5495, 73.7995],
      [18.5595, 73.7805]
    ]
  },
  {
    id: 'pune_road_006',
    name: 'Sinhagad Road (Dandekar Bridge segment)',
    road_code: 'PMC-MDR-02',
    road_type: 'Major District Road',
    ward: 'Warje-Karvenagar Ward Office',
    authority_name: 'Pune Municipal Corporation Road Department',
    last_repair_date: '2025-08-30T00:00:00.000Z',
    construction_date: '2020-07-22T00:00:00.000Z',
    status: 'Moderate',
    length_km: 3.8,
    health_score: 61,
    total_complaints: 19,
    active_complaints: 6,
    contractor_id: 'con_005',
    contractor_name: 'BuildRight Contractors',
    allocated_budget: 27000000, // ₹2.7 Crore
    spent_budget: 23200000,     // ₹2.32 Crore
    budget_remaining: 3800000,  // ₹38 Lakh
    funding_source: 'PMC Capital Works Fund',
    traffic_density: 'Very High',
    coordinates: [
      [18.5035, 73.8385],
      [18.4905, 73.8215],
      [18.4755, 73.8055]
    ]
  },
  {
    id: 'pune_road_007',
    name: 'Pune-Solapur Road (Hadapsar Flyover underpass)',
    road_code: 'PMC-NH-01',
    road_type: 'National Highway Segment',
    ward: 'Hadapsar-Mundhwa Ward Office',
    authority_name: 'National Highways Authority of India (NHAI)',
    last_repair_date: '2026-04-18T00:00:00.000Z',
    construction_date: '2024-05-10T00:00:00.000Z',
    status: 'Excellent',
    length_km: 5.6,
    health_score: 94,
    total_complaints: 1,
    active_complaints: 0,
    contractor_id: 'con_003',
    contractor_name: 'Pune Smartways & Co.',
    allocated_budget: 85000000, // ₹8.5 Crore
    spent_budget: 81000000,     // ₹8.1 Crore
    budget_remaining: 4000000,  // ₹40 Lakh
    funding_source: 'National Highway Authority Aid',
    traffic_density: 'Extreme',
    coordinates: [
      [18.5065, 73.8755],
      [18.5042, 73.9056],
      [18.5015, 73.9355]
    ]
  }
];

export const mockContractors = [
  {
    id: 'con_001',
    name: 'PMC Infrastructure Ltd.',
    company_type: 'Private Limited',
    state: 'Maharashtra',
    projects_completed: 42,
    projects_active: 3,
    complaint_count: 5,
    resolution_rate: 94,
    citizen_rating: 4.7,
    repair_completion_rate: 96,
    avg_health_score: 83,
    reliability_score: 92,
    satisfaction_score: 88,
    transparency_score: 95,
    allocated_budget: 62000000, // ₹6.2 Cr
    spent_budget: 47000000      // ₹4.7 Cr
  },
  {
    id: 'con_002',
    name: 'Maharashtra Road Builders (MRB)',
    company_type: 'Govt Contractor Class A',
    state: 'Maharashtra',
    projects_completed: 31,
    projects_active: 5,
    complaint_count: 14,
    resolution_rate: 61,
    citizen_rating: 3.1,
    repair_completion_rate: 68,
    avg_health_score: 46,
    reliability_score: 55,
    satisfaction_score: 48,
    transparency_score: 52,
    allocated_budget: 18000000, // ₹1.8 Cr
    spent_budget: 14500000      // ₹1.45 Cr
  },
  {
    id: 'con_003',
    name: 'Pune Smartways & Co.',
    company_type: 'Private Limited',
    state: 'Maharashtra',
    projects_completed: 28,
    projects_active: 2,
    complaint_count: 6,
    resolution_rate: 89,
    citizen_rating: 4.4,
    repair_completion_rate: 91,
    avg_health_score: 83,
    reliability_score: 89,
    satisfaction_score: 85,
    transparency_score: 90,
    allocated_budget: 116000000, // ₹11.6 Cr
    spent_budget: 108000000      // ₹10.8 Cr
  },
  {
    id: 'con_004',
    name: 'Western India Highways Ltd.',
    company_type: 'Public Limited',
    state: 'Gujarat/Maharashtra',
    projects_completed: 55,
    projects_active: 7,
    complaint_count: 29,
    resolution_rate: 38,
    citizen_rating: 2.2,
    repair_completion_rate: 47,
    avg_health_score: 28,
    reliability_score: 35,
    satisfaction_score: 29,
    transparency_score: 41,
    allocated_budget: 45000000,  // ₹4.5 Cr
    spent_budget: 41000000       // ₹4.1 Cr
  },
  {
    id: 'con_005',
    name: 'BuildRight Contractors',
    company_type: 'Partnership Firm',
    state: 'Maharashtra',
    projects_completed: 18,
    projects_active: 4,
    complaint_count: 19,
    resolution_rate: 72,
    citizen_rating: 3.6,
    repair_completion_rate: 76,
    avg_health_score: 61,
    reliability_score: 68,
    satisfaction_score: 63,
    transparency_score: 70,
    allocated_budget: 27000000,  // ₹2.7 Cr
    spent_budget: 23200000       // ₹2.32 Cr
  }
];

export const mockAuthorityScorecards = [
  { id: 'auth_001', name: 'PMC Road Department', jurisdiction: 'Pune Central', average_response_time: '9.5 hrs', response_hours: 9.5, resolution_rate: 86, open_complaints: 17, escalated_complaints: 4, citizen_satisfaction: 82, accountability_score: 84 },
  { id: 'auth_002', name: 'PMRDA Roads Wing', jurisdiction: 'Kothrud-Bawdhan', average_response_time: '18.2 hrs', response_hours: 18.2, resolution_rate: 63, open_complaints: 24, escalated_complaints: 9, citizen_satisfaction: 61, accountability_score: 62 },
  { id: 'auth_003', name: 'NHAI Pune Regional Office', jurisdiction: 'Highway Segments', average_response_time: '7.8 hrs', response_hours: 7.8, resolution_rate: 91, open_complaints: 8, escalated_complaints: 2, citizen_satisfaction: 88, accountability_score: 90 },
  { id: 'auth_004', name: 'Aundh-Baner Ward Office', jurisdiction: 'Aundh-Baner', average_response_time: '12.1 hrs', response_hours: 12.1, resolution_rate: 78, open_complaints: 11, escalated_complaints: 3, citizen_satisfaction: 76, accountability_score: 77 },
];

export const mockRepairHistory = [
  { id: 'rh_001', road_id: 'pune_road_001', repair_date: '2026-02-15T00:00:00.000Z', repair_cost: 1800000, repair_type: 'Pothole milling and asphalt overlay', contractor: 'PMC Infrastructure Ltd.', authority: 'Pune Municipal Corporation Road Department', before_repair: 'Multiple edge cracks near Deccan Gymkhana crossing', after_repair: 'Surface restored, lane markings repainted, no active complaints' },
  { id: 'rh_002', road_id: 'pune_road_002', repair_date: '2025-11-20T00:00:00.000Z', repair_cost: 3200000, repair_type: 'Storm-drain clearing with asphalt patching', contractor: 'Maharashtra Road Builders (MRB)', authority: 'Pune Municipal Corporation Road Department', before_repair: 'Waterlogging and exposed aggregate near FC gate', after_repair: 'Drain partially cleared; repeat complaints remain under review' },
  { id: 'rh_003', road_id: 'pune_road_003', repair_date: '2026-03-05T00:00:00.000Z', repair_cost: 4200000, repair_type: 'Sub-base stabilization and resurfacing', contractor: 'Pune Smartways & Co.', authority: 'Pune Municipal Corporation Road Department', before_repair: 'Fatigue cracking and slow road subsidence', after_repair: 'Sub-base compacted, surface evenness improved by 31%' },
  { id: 'rh_004', road_id: 'pune_road_004', repair_date: '2025-05-12T00:00:00.000Z', repair_cost: 7600000, repair_type: 'Speed-breaker correction and safety repaint', contractor: 'Western India Highways Ltd.', authority: 'Pune Metropolitan Region Development Authority', before_repair: 'Unpainted speed breaker and unsafe jolts', after_repair: 'Reflective paint added; surface deterioration still high risk' },
  { id: 'rh_005', road_id: 'pune_road_005', repair_date: '2026-01-10T00:00:00.000Z', repair_cost: 2600000, repair_type: 'Hotmix pothole repair', contractor: 'PMC Infrastructure Ltd.', authority: 'Pune Municipal Corporation Road Department', before_repair: 'Pothole outbreak near Westend Mall', after_repair: 'Main lane repaired, shoulder patch pending' },
];

const mockForums = [];
const mockForumPosts = [];
const mockNotifications = [];
const mockProfiles = [];

// ─── Community Governance Mock Data ─────────────────────────────────────────
export const mockCommunityPosts = [
  {
    id: 'cp_001', road_id: 'road_001', road_name: 'NH-44 Section A', road_code: 'NH-44',
    road_district: 'Chennai', road_state: 'Tamil Nadu', road_health: 42,
    author_id: 'u1', author_name: 'Ravi Kumar', author_level: 'road_guardian', author_points: 230,
    title: 'Massive potholes still unrepaired after 3 months — danger zone near school',
    subject_category: 'ROAD_DAMAGE', content: 'The stretch near Sri Vidya School has developed 8-10 deep potholes. Two-wheelers have already fallen here. Despite multiple complaints, no action has been taken. Attached photos show how dangerous this section has become. This needs URGENT attention before a fatality occurs.',
    upvote_count: 127, downvote_count: 3, comment_count: 34, view_count: 892,
    score: 287.1, is_pinned: true, is_supervoted: true, is_trending: true, is_locked: false, is_hidden: false,
    supervoted_by: 'u_auth', supervoted_by_name: 'District Collector, Chennai', supervoted_at: '2026-05-28T10:30:00Z',
    pinned_by: 'u_auth', pinned_at: '2026-05-28T10:30:00Z',
    media: [{ id: 'm1', media_url: null, media_type: 'image' }],
    created_at: '2026-05-20T09:15:00Z', updated_at: '2026-05-28T10:30:00Z',
    user_vote: null,
  },
  {
    id: 'cp_002', road_id: 'road_002', road_name: 'SH-22 Main Road', road_code: 'SH-22',
    road_district: 'Mumbai', road_state: 'Maharashtra', road_health: 38,
    author_id: 'u2', author_name: 'Priya Mehta', author_level: 'road_champion', author_points: 510,
    title: 'Repair work started but contractor has abandoned site for 2 weeks',
    subject_category: 'REPAIR_DELAY', content: 'The MMRDA contractor who was assigned to repair the SH-22 stretch started work on May 5th, dug up the road, and then simply disappeared. Now we have an open trench with no barricades and no lights at night. Multiple near-misses reported. What is the executive engineer doing?',
    upvote_count: 89, downvote_count: 7, comment_count: 21, view_count: 543,
    score: 193.8, is_pinned: false, is_supervoted: false, is_trending: true, is_locked: false, is_hidden: false,
    supervoted_by: null, supervoted_by_name: null, supervoted_at: null,
    pinned_by: null, pinned_at: null,
    media: [],
    created_at: '2026-05-22T14:30:00Z', updated_at: '2026-05-26T18:00:00Z',
    user_vote: 'UPVOTE',
  },
  {
    id: 'cp_003', road_id: 'road_003', road_name: 'Pune-Nashik Highway', road_code: 'NH-60',
    road_district: 'Pune', road_state: 'Maharashtra', road_health: 55,
    author_id: 'u3', author_name: 'Anand Sharma', author_level: 'road_reporter', author_points: 85,
    title: 'Flooding every monsoon — drainage system completely broken',
    subject_category: 'FLOODING', content: 'Every year like clockwork, this 3km stretch floods completely during monsoon. Vehicles stall, people are stranded. The PWD has been collecting drainage cess for 5 years but the drains are still clogged. I have RTI proof that ₹2.3 crore was allocated for drainage repair in 2024.',
    upvote_count: 64, downvote_count: 2, comment_count: 18, view_count: 421,
    score: 143.1, is_pinned: false, is_supervoted: false, is_trending: false, is_locked: false, is_hidden: false,
    supervoted_by: null, supervoted_by_name: null, supervoted_at: null,
    pinned_by: null, pinned_at: null,
    media: [],
    created_at: '2026-05-18T11:20:00Z', updated_at: '2026-05-25T09:45:00Z',
    user_vote: null,
  },
  {
    id: 'cp_004', road_id: 'road_004', road_name: 'Outer Ring Road', road_code: 'ORR-1',
    road_district: 'Bengaluru', road_state: 'Karnataka', road_health: 67,
    author_id: 'u4', author_name: 'Deepa Nair', author_level: 'road_scout', author_points: 25,
    title: 'Streetlights have been off for 6 months on 4km stretch — accidents increasing',
    subject_category: 'STREETLIGHT_FAILURE', content: 'The streetlights on ORR from Hebbal to Nagawara have been non-functional since November 2025. BBMP acknowledges the fault but says it is BESCOM\'s responsibility. BESCOM says it\'s BBMP. Meanwhile 3 accidents have occurred. Nobody is taking ownership.',
    upvote_count: 45, downvote_count: 1, comment_count: 12, view_count: 287,
    score: 99.7, is_pinned: false, is_supervoted: false, is_trending: false, is_locked: false, is_hidden: false,
    supervoted_by: null, supervoted_by_name: null, supervoted_at: null,
    pinned_by: null, pinned_at: null,
    media: [],
    created_at: '2026-05-15T16:00:00Z', updated_at: '2026-05-23T12:30:00Z',
    user_vote: 'DOWNVOTE',
  },
  {
    id: 'cp_005', road_id: 'road_001', road_name: 'NH-44 Section A', road_code: 'NH-44',
    road_district: 'Chennai', road_state: 'Tamil Nadu', road_health: 42,
    author_id: 'u5', author_name: 'Karthik Rajan', author_level: 'road_reporter', author_points: 140,
    title: 'Speed breakers placed without reflectors — causing accidents at night',
    subject_category: 'SAFETY_CONCERN', content: 'Three speed breakers were constructed near the toll plaza but none have reflective markers or warning signs. At night, vehicles don\'t see them until the last moment. Please paint them yellow and add advance warning signs.',
    upvote_count: 32, downvote_count: 0, comment_count: 8, view_count: 156,
    score: 72.6, is_pinned: false, is_supervoted: false, is_trending: false, is_locked: false, is_hidden: false,
    supervoted_by: null, supervoted_by_name: null, supervoted_at: null,
    pinned_by: null, pinned_at: null,
    media: [],
    created_at: '2026-05-25T08:00:00Z', updated_at: '2026-05-25T08:00:00Z',
    user_vote: null,
  },
  {
    id: 'cp_006', road_id: 'road_005', road_name: 'Delhi-Gurugram Expressway', road_code: 'NH-48',
    road_district: 'Delhi', road_state: 'Delhi', road_health: 54,
    author_id: 'u6', author_name: 'Meera Joshi', author_level: 'road_guardian', author_points: 295,
    title: 'GOVERNMENT RESPONSE NEEDED: 12 accidents on this road in 30 days',
    subject_category: 'ACCIDENT_REPORT', content: 'I have compiled police FIR numbers for 12 accidents that occurred between KM 18-22 in the last 30 days. 3 were fatal. The common factor: road surface has collapsed creating a sudden 15cm drop. This is a criminal negligence situation. Tagging District Collector and RTO.',
    upvote_count: 201, downvote_count: 4, comment_count: 67, view_count: 1243,
    score: 468.8, is_pinned: false, is_supervoted: false, is_trending: true, is_locked: false, is_hidden: false,
    supervoted_by: null, supervoted_by_name: null, supervoted_at: null,
    pinned_by: null, pinned_at: null,
    media: [],
    created_at: '2026-05-19T07:30:00Z', updated_at: '2026-05-29T15:00:00Z',
    user_vote: null,
  },
];

export const mockCommunityComments = {
  cp_001: [
    { id: 'c1', post_id: 'cp_001', author_name: 'Suresh Babu', author_level: 'road_scout', is_authority_reply: false, content: 'I ride past this daily. Two days ago my friend fell here. The pothole depth is almost 6 inches now.', upvote_count: 23, parent_comment_id: null, created_at: '2026-05-21T10:00:00Z' },
    { id: 'c2', post_id: 'cp_001', author_name: 'Jt. Commissioner, NHAI', author_level: 'executive_engineer', is_authority_reply: true, content: 'We have taken note of this complaint. Inspection has been scheduled for June 2nd. Emergency patching will begin within 48 hours of inspection. Thank you for your patience.', upvote_count: 45, parent_comment_id: null, created_at: '2026-05-28T11:00:00Z' },
    { id: 'c3', post_id: 'cp_001', author_name: 'Lakshmi Devi', author_level: 'road_reporter', is_authority_reply: false, content: '@Jt. Commissioner — Please also address the missing road markers at KM 12. We will be watching!', upvote_count: 12, parent_comment_id: 'c2', created_at: '2026-05-28T12:30:00Z' },
  ],
  cp_002: [
    { id: 'c4', post_id: 'cp_002', author_name: 'Ram Patil', author_level: 'road_scout', is_authority_reply: false, content: 'This is outrageous. Who is accountable when an accident happens in that open trench?', upvote_count: 18, parent_comment_id: null, created_at: '2026-05-23T09:00:00Z' },
  ],
  cp_006: [
    { id: 'c5', post_id: 'cp_006', author_name: 'District RTO Office', author_level: 'district_authority', is_authority_reply: true, content: 'We have received this report. Emergency repair order has been issued. NHAI Regional Director has been notified. Please share FIR numbers via our helpline 1800-xxx-xxxx for follow-up.', upvote_count: 87, parent_comment_id: null, created_at: '2026-05-20T14:00:00Z' },
  ],
};

export const mockRoadsForGovernance = [
  { id: 'pune_road_001', name: 'Jangali Maharaj (JM) Road', road_code: 'PMC-URB-01', district: 'Pune', state: 'Maharashtra', ward: 'Shivajinagar-Ghole Road Ward Office', authority: 'Pune Municipal Corporation Road Department', health_score: 89, total_complaints: 2 },
  { id: 'pune_road_002', name: 'Fergusson College (FC) Road', road_code: 'PMC-URB-02', district: 'Pune', state: 'Maharashtra', ward: 'Shivajinagar-Ghole Road Ward Office', authority: 'Pune Municipal Corporation Road Department', health_score: 46, total_complaints: 14 },
  { id: 'pune_road_003', name: 'Senapati Bapat (SB) Road', road_code: 'PMC-URB-03', district: 'Pune', state: 'Maharashtra', ward: 'Shivajinagar-Ghole Road Ward Office', authority: 'Pune Municipal Corporation Road Department', health_score: 72, total_complaints: 5 },
  { id: 'pune_road_004', name: 'Karve Road (Nal Stop Segment)', road_code: 'PMC-MDR-01', district: 'Pune', state: 'Maharashtra', ward: 'Kothrud-Bawdhan Ward Office', authority: 'Pune Metropolitan Region Development Authority', health_score: 28, total_complaints: 29 },
  { id: 'pune_road_005', name: 'Baner Road (Aundh-Baner link)', road_code: 'PMC-URB-04', district: 'Pune', state: 'Maharashtra', ward: 'Aundh-Baner Ward Office', authority: 'Pune Municipal Corporation Road Department', health_score: 78, total_complaints: 6 },
  { id: 'pune_road_006', name: 'Sinhagad Road (Dandekar Bridge segment)', road_code: 'PMC-MDR-02', district: 'Pune', state: 'Maharashtra', ward: 'Warje-Karvenagar Ward Office', authority: 'Pune Municipal Corporation Road Department', health_score: 61, total_complaints: 19 },
  { id: 'pune_road_007', name: 'Pune-Solapur Road (Hadapsar Flyover underpass)', road_code: 'PMC-NH-01', district: 'Pune', state: 'Maharashtra', ward: 'Hadapsar-Mundhwa Ward Office', authority: 'National Highways Authority of India (NHAI)', health_score: 94, total_complaints: 1 },
];

let communityPosts = [...mockCommunityPosts];
let communityComments = { ...mockCommunityComments };

// Community Governance API layer
export const communityAPI = {
  // List/filter posts
  async getPosts({ roadId, category, district, sort = 'score', search = '', page = 1, limit = 10 } = {}) {
    await new Promise(r => setTimeout(r, 400)); // simulate latency
    let posts = communityPosts.filter(p => !p.is_hidden);
    if (roadId) posts = posts.filter(p => p.road_id === roadId);
    if (category && category !== 'ALL') posts = posts.filter(p => p.subject_category === category);
    if (district && district !== 'ALL') posts = posts.filter(p => p.road_district === district);
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.road_name.toLowerCase().includes(q) ||
        (p.road_code || '').toLowerCase().includes(q)
      );
    }
    // Sort
    const pinned = posts.filter(p => p.is_pinned);
    const supervoted = posts.filter(p => p.is_supervoted && !p.is_pinned);
    let rest = posts.filter(p => !p.is_pinned && !p.is_supervoted);
    if (sort === 'score') rest.sort((a, b) => b.score - a.score);
    else if (sort === 'newest') rest.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'upvotes') rest.sort((a, b) => b.upvote_count - a.upvote_count);
    else if (sort === 'comments') rest.sort((a, b) => b.comment_count - a.comment_count);
    else if (sort === 'views') rest.sort((a, b) => b.view_count - a.view_count);
    const sorted = [...pinned, ...supervoted, ...rest];
    const start = (page - 1) * limit;
    return { posts: sorted.slice(start, start + limit), total: sorted.length, hasMore: start + limit < sorted.length };
  },

  async getPost(id) {
    await new Promise(r => setTimeout(r, 200));
    const post = communityPosts.find(p => p.id === id);
    if (post) post.view_count += 1;
    return post || null;
  },

  async createPost(data) {
    await new Promise(r => setTimeout(r, 600));
    const road = mockRoadsForGovernance.find(r => r.id === data.road_id) || {};
    const newPost = {
      id: 'cp_' + Math.random().toString(36).substr(2, 6),
      ...data,
      road_name: road.name || 'Unknown Road',
      road_code: road.road_code || '',
      road_district: road.district || '',
      road_state: road.state || '',
      road_health: road.health_score || 50,
      author_name: data.author_name || 'Anonymous',
      author_level: data.author_level || 'road_scout',
      author_points: data.author_points || 0,
      upvote_count: 0, downvote_count: 0, comment_count: 0, view_count: 0,
      score: 0, is_pinned: false, is_supervoted: false, is_trending: false,
      is_locked: false, is_hidden: false,
      media: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      user_vote: null,
    };
    communityPosts.unshift(newPost);
    return newPost;
  },

  async vote(postId, voteType) {
    await new Promise(r => setTimeout(r, 200));
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return null;
    if (post.user_vote === voteType) {
      // Remove vote
      if (voteType === 'UPVOTE') post.upvote_count = Math.max(0, post.upvote_count - 1);
      else post.downvote_count = Math.max(0, post.downvote_count - 1);
      post.user_vote = null;
    } else {
      if (post.user_vote) {
        if (post.user_vote === 'UPVOTE') post.upvote_count = Math.max(0, post.upvote_count - 1);
        else post.downvote_count = Math.max(0, post.downvote_count - 1);
      }
      if (voteType === 'UPVOTE') post.upvote_count += 1;
      else post.downvote_count += 1;
      post.user_vote = voteType;
    }
    post.score = (post.upvote_count * 2) - (post.downvote_count) + (post.comment_count * 0.5) + (post.view_count * 0.1);
    post.is_trending = post.upvote_count > 50 || post.comment_count > 20 || post.view_count > 500;
    return post;
  },

  async getComments(postId) {
    await new Promise(r => setTimeout(r, 300));
    return communityComments[postId] || [];
  },

  async addComment(postId, content, parentId = null, authorName = 'You', authorLevel = 'road_scout') {
    await new Promise(r => setTimeout(r, 400));
    const comment = {
      id: 'c_' + Math.random().toString(36).substr(2, 6),
      post_id: postId, author_name: authorName, author_level: authorLevel,
      is_authority_reply: false, content, upvote_count: 0,
      parent_comment_id: parentId, created_at: new Date().toISOString(),
    };
    if (!communityComments[postId]) communityComments[postId] = [];
    communityComments[postId].unshift(comment);
    const post = communityPosts.find(p => p.id === postId);
    if (post) { post.comment_count += 1; post.score += 0.5; }
    return comment;
  },

  async getRoads(query = '') {
    await new Promise(r => setTimeout(r, 150));
    if (!query) return mockRoadsForGovernance;
    const q = query.toLowerCase();
    return mockRoadsForGovernance.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.road_code.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q)
    );
  },

  getAnalytics() {
    const totalPosts = communityPosts.length;
    const totalUpvotes = communityPosts.reduce((s, p) => s + p.upvote_count, 0);
    const trending = communityPosts.filter(p => p.is_trending).length;
    const supervoted = communityPosts.filter(p => p.is_supervoted).length;
    return { totalPosts, totalUpvotes, trending, supervoted };
  },
};

// ─── Original MockEntity class (unchanged) ───────────────────────────────────
// Seeding initial complaints if not present
const COMPLAINTS_KEY = 'rw_mock_complaints';
if (!localStorage.getItem(COMPLAINTS_KEY)) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify([
    {
      id: 'pune_cmp_1',
      title: 'Deep pothole cluster near Deccan Gymkhana crossing',
      description: 'A series of 4 deep potholes have opened up right on the pedestrian crossing near Deccan Gymkhana. Extremely dangerous for two-wheelers, especially during night-time when streetlights are dim.',
      severity: 'Critical',
      status: 'Submitted',
      category: 'Road Damage',
      location_text: 'Jangali Maharaj (JM) Road, near Deccan Gymkhana, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5202,
      longitude: 73.8495,
      road_id: 'pune_road_001',
      ward: 'Shivajinagar-Ghole Road Ward Office',
      authority: 'Pune Municipal Corporation Road Department',
      upvote_count: 42,
      ai_confidence: 0.89,
      ai_verification_status: 'AI Verified',
      detected_issue_type: 'Pothole',
      severity_prediction: 'Critical',
      verification_count: 31,
      duplicate_count: 2,
      confirm_count: 24,
      incorrect_count: 1,
      community_confidence_score: 92,
      verification_status: 'Verified by Community',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'pune_cmp_2',
      title: 'Waterlogging and asphalt washing away near FC gate',
      description: 'Major waterlogging occurring near the Fergusson College gate due to a blocked storm-drain. The accumulated water has washed away the top asphalt layer, exposing sharp stone base.',
      severity: 'High',
      status: 'In Progress',
      category: 'Flooding',
      location_text: 'Fergusson College (FC) Road, opposite main gate, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5235,
      longitude: 73.8445,
      road_id: 'pune_road_002',
      ward: 'Shivajinagar-Ghole Road Ward Office',
      authority: 'Pune Municipal Corporation Road Department',
      upvote_count: 28,
      ai_confidence: 0.74,
      ai_verification_status: 'Under Review',
      detected_issue_type: 'Waterlogging',
      severity_prediction: 'High',
      verification_count: 18,
      duplicate_count: 4,
      confirm_count: 16,
      incorrect_count: 2,
      community_confidence_score: 76,
      verification_status: 'Under Review',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'pune_cmp_3',
      title: 'Asphalt cracking and road subsidence near Symbiosis',
      description: 'A large section of SB road near Symbiosis is sinking slowly. Extensive fatigue cracks (alligator cracking) have formed over a 20-meter stretch, likely due to heavy bus traffic.',
      severity: 'Medium',
      status: 'Resolved',
      category: 'Road Damage',
      location_text: 'Senapati Bapat (SB) Road, near Symbiosis Institute, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5305,
      longitude: 73.8325,
      road_id: 'pune_road_003',
      ward: 'Shivajinagar-Ghole Road Ward Office',
      authority: 'Pune Municipal Corporation Road Department',
      upvote_count: 15,
      ai_confidence: 0.91,
      ai_verification_status: 'AI Verified',
      detected_issue_type: 'Road Crack',
      severity_prediction: 'Medium',
      verification_count: 12,
      duplicate_count: 0,
      confirm_count: 11,
      incorrect_count: 0,
      community_confidence_score: 88,
      verification_status: 'Verified by Community',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
    {
      id: 'pune_cmp_4',
      title: 'Severe road surface deterioration near Westend Mall',
      description: 'Heavy commuter traffic has caused pothole outbreaks on the main lane of Baner Road right in front of Westend Mall. Causes severe traffic snarls during peak office hours.',
      severity: 'High',
      status: 'Submitted',
      category: 'Road Damage',
      location_text: 'Baner Road, opposite Westend Mall, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5495,
      longitude: 73.7995,
      road_id: 'pune_road_005',
      ward: 'Aundh-Baner Ward Office',
      authority: 'Pune Municipal Corporation Road Department',
      upvote_count: 34,
      ai_confidence: 0.85,
      ai_verification_status: 'AI Verified',
      detected_issue_type: 'Unsafe Surface',
      severity_prediction: 'High',
      verification_count: 21,
      duplicate_count: 1,
      confirm_count: 19,
      incorrect_count: 1,
      community_confidence_score: 84,
      verification_status: 'AI Verified',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    {
      id: 'pune_cmp_5',
      title: 'Damaged and unpainted speed breaker causing severe jolts',
      description: 'The newly constructed speed breaker near Nal Stop is unpainted and does not have reflective markers. Several two-wheeler riders have lost balance here at night. High accident risk.',
      severity: 'Critical',
      status: 'In Progress',
      category: 'Safety',
      location_text: 'Karve Road, Nal Stop Flyover underpass, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      latitude: 18.5095,
      longitude: 73.8325,
      road_id: 'pune_road_004',
      ward: 'Kothrud-Bawdhan Ward Office',
      authority: 'Pune Metropolitan Region Development Authority',
      upvote_count: 57,
      ai_confidence: 0.95,
      ai_verification_status: 'AI Verified',
      detected_issue_type: 'Broken Divider',
      severity_prediction: 'Critical',
      verification_count: 44,
      duplicate_count: 6,
      confirm_count: 39,
      incorrect_count: 1,
      community_confidence_score: 94,
      verification_status: 'Duplicate Report',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    }
  ]));
}

class MockEntity {
  constructor(name) { this.name = name; }
  async list(sort = '-created_date', limit = 50) {
    let data = [];
    const apiName = apiEntityMap[this.name];
    if (apiName) {
      try {
        const apiData = await apiRequest(`/${apiName}`);
        if (Array.isArray(apiData) && apiData.length > 0) {
          data = apiData;
          if (sort === '-created_date' || sort === '-created_at') {
            data.sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0));
          }
          return data.slice(0, limit);
        }
      } catch {
        // Offline/demo fallback below.
      }
    }
    if (this.name === 'Complaint') {
      data = JSON.parse(localStorage.getItem(COMPLAINTS_KEY)) || [];
    } else if (this.name === 'Road') {
      data = [...mockRoads];
    } else if (this.name === 'Contractor') {
      data = [...mockContractors];
    } else if (this.name === 'Forum') {
      data = [...mockForums];
    } else if (this.name === 'ForumPost') {
      data = [...mockForumPosts];
    } else if (this.name === 'Notification') {
      data = JSON.parse(localStorage.getItem('rw_notifications')) || [];
    } else if (this.name === 'UserProfile') {
      const active = JSON.parse(localStorage.getItem('rw_active_profile'));
      data = active ? [active] : [];
    } else if (this.name === 'RoadTimeline') {
      data = [...mockRepairHistory].map(item => ({
        id: item.id,
        road_id: item.road_id,
        event_type: 'Repair Completed',
        description: `${item.repair_type}. Before: ${item.before_repair}. After: ${item.after_repair}. Cost: ₹${(item.repair_cost / 100000).toFixed(1)} Lakh.`,
        event_date: item.repair_date,
        actor_name: `${item.contractor} / ${item.authority}`,
        repair_cost: item.repair_cost,
        repair_type: item.repair_type,
        contractor: item.contractor,
        authority: item.authority,
        before_repair: item.before_repair,
        after_repair: item.after_repair,
      }));
    }

    // Sort
    if (sort === '-created_date' || sort === '-created_at') {
      data.sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));
    }
    return data.slice(0, limit);
  }

  async filter(query = {}, sort = '-created_date', limit = 50) {
    const data = await this.list(sort, limit * 2);
    return data.filter(item => { 
      for (const [k, v] of Object.entries(query)) { 
        if (item[k] !== v) return false; 
      } 
      return true; 
    }).slice(0, limit);
  }

  async create(data) {
    const apiName = apiEntityMap[this.name];
    if (apiName) {
      try {
        const created = await apiRequest(`/${apiName}`, { method: 'POST', body: JSON.stringify(data) });
        window.dispatchEvent(new Event('storage'));
        return created;
      } catch {
        // Queue complaints for background sync and continue local-first.
        if (this.name === 'Complaint') {
          const queue = JSON.parse(localStorage.getItem('rw_offline_complaints') || '[]');
          queue.unshift({ ...data, id: 'offline_' + Math.random().toString(36).slice(2), offline_created_at: new Date().toISOString() });
          localStorage.setItem('rw_offline_complaints', JSON.stringify(queue));
        }
      }
    }
    const id = 'cmp_' + Math.random().toString(36).substr(2, 6);
    const newItem = { 
      id, 
      ai_verification_status: data.ai_verification_status || 'AI Verified',
      detected_issue_type: data.detected_issue_type || data.category || 'Unsafe Surface',
      severity_prediction: data.severity_prediction || data.severity || 'Medium',
      verification_count: data.verification_count || 0,
      duplicate_count: data.duplicate_count || 0,
      confirm_count: data.confirm_count || 0,
      incorrect_count: data.incorrect_count || 0,
      community_confidence_score: data.community_confidence_score || 50,
      verification_status: data.verification_status || 'Under Review',
      ...data, 
      created_date: new Date().toISOString(), 
      updated_date: new Date().toISOString() 
    };

    if (this.name === 'Complaint') {
      const list = JSON.parse(localStorage.getItem(COMPLAINTS_KEY)) || [];
      list.unshift(newItem);
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));

      // Auto update total reports count in profile
      const active = JSON.parse(localStorage.getItem('rw_active_profile'));
      if (active) {
        active.total_reports = (active.total_reports || 0) + 1;
        active.points = (active.points || 0) + 10; // +10 points for filing complaint
        localStorage.setItem('rw_active_profile', JSON.stringify(active));
      }

      // Add a notification
      const notifs = JSON.parse(localStorage.getItem('rw_notifications')) || [];
      notifs.unshift({
        id: 'notif_' + Math.random().toString(36).substr(2, 6),
        title: '📝 New Complaint Filed',
        body: `Report "${newItem.title}" has been successfully filed in ${newItem.district}.`,
        priority: 'medium',
        type: 'complaint_update',
        is_read: false,
        created_date: new Date().toISOString()
      });
      localStorage.setItem('rw_notifications', JSON.stringify(notifs));
      window.dispatchEvent(new Event('storage'));
    }
    return newItem;
  }

  async update(id, data) {
    const apiName = apiEntityMap[this.name];
    if (apiName) {
      try {
        const updated = await apiRequest(`/${apiName}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        window.dispatchEvent(new Event('storage'));
        return updated;
      } catch {
        // Offline fallback below.
      }
    }
    if (this.name === 'Complaint') {
      const list = JSON.parse(localStorage.getItem(COMPLAINTS_KEY)) || [];
      const idx = list.findIndex(item => item.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, updated_date: new Date().toISOString() };
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
        return list[idx];
      }
    } else if (this.name === 'UserProfile') {
      const active = JSON.parse(localStorage.getItem('rw_active_profile'));
      if (active) {
        const updated = { ...active, ...data };
        localStorage.setItem('rw_active_profile', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        return updated;
      }
    }
    return null;
  }

  async delete(id) {
    const apiName = apiEntityMap[this.name];
    if (apiName) {
      try {
        await apiRequest(`/${apiName}/${id}`, { method: 'DELETE' });
        window.dispatchEvent(new Event('storage'));
        return true;
      } catch {
        // Offline fallback below.
      }
    }
    if (this.name === 'Complaint') {
      const list = JSON.parse(localStorage.getItem(COMPLAINTS_KEY)) || [];
      const filtered = list.filter(item => item.id !== id);
      if (filtered.length !== list.length) {
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
        return true;
      }
    }
    return false;
  }
}

class MockAuth {
  async me() { 
    try {
      return await apiRequest('/auth/me');
    } catch {
      // Local fallback.
    }
    return currentUser || JSON.parse(localStorage.getItem('rw_current_user')) || null; 
  }
  async loginViaEmailPassword(email, password) {
    try {
      const { token, user } = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      currentUser = user;
      localStorage.setItem('rw_current_user', JSON.stringify(user));
      localStorage.setItem('mock_auth_token', token);
      localStorage.setItem('rw_user_password', password); // Cache password!
      if (!localStorage.getItem('rw_active_profile')) {
        localStorage.setItem('rw_active_profile', JSON.stringify({
          display_name: user.name,
          level: 'Road Scout',
          points: 250,
          total_reports: 3,
          verified_reports: 2,
          forum_posts: 1,
          district: user.assigned_district || 'Pune',
          state: user.assigned_state || 'Maharashtra',
          profile_image_url: null,
          role: user.role || 'citizen',
          phone: user.phone || '',
          email: user.email || email,
        }));
      } else {
        const prof = JSON.parse(localStorage.getItem('rw_active_profile'));
        prof.email = user.email || email;
        prof.phone = user.phone || prof.phone || '';
        localStorage.setItem('rw_active_profile', JSON.stringify(prof));
      }
      window.dispatchEvent(new Event('storage'));
      return user;
    } catch {
      // Local fallback.
    }
    const user = { id: 'user_' + Math.random().toString(36).substr(2, 9), email, name: email.split('@')[0], role: 'citizen' };
    currentUser = user; 
    localStorage.setItem('rw_current_user', JSON.stringify(user));
    localStorage.setItem('mock_auth_token', 'token_' + user.id); 
    localStorage.setItem('rw_user_password', password); // Cache password!
    
    // Seed initial profile on login if missing
    let profile = JSON.parse(localStorage.getItem('rw_active_profile'));
    if (!profile) {
      profile = {
        display_name: user.name,
        level: 'Road Scout',
        points: 250,
        total_reports: 3,
        verified_reports: 2,
        forum_posts: 1,
        district: 'Chennai',
        state: 'Tamil Nadu',
        profile_image_url: null,
        role: 'citizen',
        phone: '',
        email: email,
      };
      localStorage.setItem('rw_active_profile', JSON.stringify(profile));
    } else {
      profile.email = email;
      profile.phone = profile.phone || '';
      localStorage.setItem('rw_active_profile', JSON.stringify(profile));
    }
    window.dispatchEvent(new Event('storage'));
    return user;
  }
  async register(data) {
    try {
      const created = await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify({ name: data.name || data.email.split('@')[0], email: data.email, password: data.password, role: 'citizen', status: 'active', assigned_district: data.district, assigned_state: data.state, phone: data.phone || '' }) });
      currentUser = created;
      localStorage.setItem('rw_current_user', JSON.stringify(created));
      localStorage.setItem('mock_auth_token', `token_${created.id}`);
      localStorage.setItem('rw_user_password', data.password); // Cache password!
      
      localStorage.setItem('rw_active_profile', JSON.stringify({
        display_name: created.name,
        level: 'Road Scout',
        points: 0,
        total_reports: 0,
        verified_reports: 0,
        forum_posts: 0,
        district: created.assigned_district || 'Chennai',
        state: created.assigned_state || 'Tamil Nadu',
        profile_image_url: null,
        role: 'citizen',
        phone: created.phone || '',
        email: created.email,
      }));
      window.dispatchEvent(new Event('storage'));
      return created;
    } catch {
      // Local fallback.
    }
    const user = { id: 'user_' + Math.random().toString(36).substr(2, 9), email: data.email, name: data.email.split('@')[0], role: 'citizen' };
    currentUser = user; 
    localStorage.setItem('rw_current_user', JSON.stringify(user));
    localStorage.setItem('mock_auth_token', 'token_' + user.id); 
    localStorage.setItem('rw_user_password', data.password); // Cache password!
    
    const profile = {
      display_name: user.name,
      level: 'Road Scout',
      points: 0,
      total_reports: 0,
      verified_reports: 0,
      forum_posts: 0,
      district: data.district || 'Chennai',
      state: data.state || 'Tamil Nadu',
      profile_image_url: null,
      role: 'citizen',
      phone: data.phone || '',
      email: data.email,
    };
    localStorage.setItem('rw_active_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    return user;
  }
  async verifyOtp(data) { return { access_token: 'token_' + currentUser?.id || 'temp', user: currentUser }; }
  async resendOtp(email) { return true; }
  async resetPasswordRequest(email) { return true; }
  async resetPassword(data) { return true; }
  async loginWithProvider(provider, redirectUrl) {
    const user = { id: 'user_' + Math.random().toString(36).substr(2, 9), email: `${provider}_user@example.com`, name: 'OAuth User', role: 'citizen' };
    currentUser = user; 
    localStorage.setItem('rw_current_user', JSON.stringify(user));
    localStorage.setItem('mock_auth_token', 'token_' + user.id); 
    window.location.href = redirectUrl || '/';
  }
  setToken(token) { localStorage.setItem('mock_auth_token', token); }
  logout(redirectUrl) { 
    currentUser = null; 
    localStorage.removeItem('mock_auth_token'); 
    localStorage.removeItem('rw_current_user'); 
    localStorage.removeItem('rw_active_profile');
    if (redirectUrl) window.location.href = redirectUrl; 
  }
  redirectToLogin(redirectUrl) { window.location.href = redirectUrl || '/login'; }
}

let currentUser = JSON.parse(localStorage.getItem('rw_current_user')) || null;

export const base44 = {
  auth: new MockAuth(),
  entities: {
    Complaint: new MockEntity('Complaint'),
    Road: new MockEntity('Road'),
    Contractor: new MockEntity('Contractor'),
    Authority: new MockEntity('Authority'),
    Forum: new MockEntity('Forum'),
    ForumPost: new MockEntity('ForumPost'),
    Notification: new MockEntity('Notification'),
    UserProfile: new MockEntity('UserProfile'),
    RoadTimeline: new MockEntity('RoadTimeline'),
    Dataset: new MockEntity('Dataset'),
    City: new MockEntity('City'),
    Ward: new MockEntity('Ward'),
  }
};
