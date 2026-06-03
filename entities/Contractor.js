{
  "name": "Contractor",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "registration_number": {
      "type": "string"
    },
    "company_type": {
      "type": "string",
      "enum": [
        "Private",
        "Government",
        "PSU",
        "Joint Venture"
      ],
      "default": "Private"
    },
    "state": {
      "type": "string"
    },
    "district": {
      "type": "string"
    },
    "projects_completed": {
      "type": "number",
      "default": 0
    },
    "roads_constructed": {
      "type": "number",
      "default": 0
    },
    "avg_health_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "complaint_count": {
      "type": "number",
      "default": 0
    },
    "repair_count": {
      "type": "number",
      "default": 0
    },
    "satisfaction_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "reliability_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "transparency_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "rank": {
      "type": "number"
    },
    "total_budget_handled": {
      "type": "number"
    },
    "on_time_completion_rate": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "contact_email": {
      "type": "string"
    },
    "contact_phone": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ]
}