{
  "name": "RoadTimeline",
  "type": "object",
  "properties": {
    "road_id": {
      "type": "string"
    },
    "event_type": {
      "type": "string",
      "enum": [
        "Road Built",
        "Repair Completed",
        "Complaint Filed",
        "Inspection Conducted",
        "Pothole Detected",
        "Repair Approved",
        "Budget Allocated",
        "Contractor Assigned",
        "Status Update",
        "Forum Created"
      ]
    },
    "description": {
      "type": "string"
    },
    "event_date": {
      "type": "string",
      "format": "date"
    },
    "actor_name": {
      "type": "string"
    },
    "actor_role": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "enum": [
        "info",
        "warning",
        "success",
        "critical"
      ],
      "default": "info"
    }
  },
  "required": [
    "road_id",
    "event_type"
  ]
}