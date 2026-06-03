import { config } from '../config.js';

export async function analyzeComplaint({ complaint, image }) {
  if (image) {
    try {
      const form = new FormData();
      form.append('file', image);
      const res = await fetch(`${config.aiServiceUrl}/detect-image`, { method: 'POST', body: form });
      if (res.ok) return normalizeAi(await res.json(), complaint);
    } catch {
      // Fall through to deterministic local inference for offline/demo mode.
    }
  }
  return normalizeAi({
    issue_type: complaint.category || 'Unsafe Surface',
    confidence: complaint.ai_confidence || 0.86,
    severity_score: severityScore(complaint.severity),
    duplicate: false,
    bounding_boxes: [],
    annotated_image_url: complaint.annotated_image_url || null,
    metadata: { source: 'local-fallback', model: 'roadwatch-demo-detector' },
  }, complaint);
}

function normalizeAi(raw, complaint) {
  return {
    id: `ai_${complaint.id}`,
    complaint_id: complaint.id,
    road_id: complaint.road_id,
    authority: complaint.authority,
    contractor_id: complaint.contractor_id || null,
    original_image: complaint.media_urls?.[0] || null,
    annotated_image: raw.annotated_image_url || raw.annotated_image || null,
    issue_type: raw.issue_type || raw.detected_issue_type || complaint.category || 'Unsafe Surface',
    confidence: Math.round(Number(raw.confidence || raw.average_confidence || 0.86) * (Number(raw.confidence) <= 1 ? 100 : 1)),
    severity_score: Number(raw.severity_score || severityScore(complaint.severity)),
    duplicate_detection: Boolean(raw.duplicate || raw.is_duplicate),
    bounding_boxes: raw.bounding_boxes || raw.detections || [],
    detection_metadata: raw.metadata || raw.raw_response || raw,
    created_at: new Date().toISOString(),
  };
}

function severityScore(severity = 'Medium') {
  return { Low: 2, Medium: 5, High: 7, Critical: 9 }[severity] || 5;
}
