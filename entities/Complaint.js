{
  "name": "Complaint",
  "type": "object",
  "properties": {
    "road_id": {
      "type": "string"
    },
    "road_name": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "enum": [
        "Pothole",
        "Crack",
        "Waterlogging",
        "Broken Road",
        "Missing Signage",
        "Unsafe Construction",
        "Drainage Issue",
        "Other"
      ],
      "default": "Pothole"
    },
    "severity": {
      "type": "string",
      "enum": [
        "Low",
        "Medium",
        "High",
        "Critical"
      ],
      "default": "Medium"
    },
    "status": {
      "type": "string",
      "enum": [
        "Submitted",
        "AI Verified",
        "Under Review",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected"
      ],
      "default": "Submitted"
    },
    "media_urls": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "location_text": {
      "type": "string"
    },
    "district": {
      "type": "string"
    },
    "state": {
      "type": "string"
    },
    "upvotes": {
      "type": "number",
      "default": 0
    },
    "verified_count": {
      "type": "number",
      "default": 0
    },
    "ai_confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "ai_severity_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 10
    },
    "ai_defect_type": {
      "type": "string"
    },
    "is_duplicate": {
      "type": "boolean",
      "default": false
    },
    "reporter_name": {
      "type": "string"
    },
    "reporter_level": {
      "type": "string"
    },
    "assigned_officer": {
      "type": "string"
    },
    "forum_created": {
      "type": "boolean",
      "default": false
    },
    "resolved_at": {
      "type": "string",
      "format": "date"
    }
  },
  "required": [
    "title",
    "category"
  ]
}