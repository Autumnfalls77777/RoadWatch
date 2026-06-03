{
  "name": "Road",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Road name"
    },
    "road_type": {
      "type": "string",
      "enum": [
        "National Highway",
        "State Highway",
        "District Road",
        "Urban Road",
        "Rural Road"
      ],
      "default": "Urban Road"
    },
    "length_km": {
      "type": "number"
    },
    "district": {
      "type": "string"
    },
    "state": {
      "type": "string"
    },
    "construction_date": {
      "type": "string",
      "format": "date"
    },
    "last_repair_date": {
      "type": "string",
      "format": "date"
    },
    "contractor_id": {
      "type": "string"
    },
    "contractor_name": {
      "type": "string"
    },
    "authority_name": {
      "type": "string"
    },
    "health_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "status": {
      "type": "string",
      "enum": [
        "Excellent",
        "Good",
        "Moderate",
        "Poor",
        "Critical",
        "Under Repair",
        "Closed"
      ],
      "default": "Good"
    },
    "allocated_budget": {
      "type": "number"
    },
    "spent_budget": {
      "type": "number"
    },
    "total_complaints": {
      "type": "number",
      "default": 0
    },
    "total_repairs": {
      "type": "number",
      "default": 0
    },
    "traffic_density": {
      "type": "string",
      "enum": [
        "Low",
        "Medium",
        "High",
        "Very High"
      ],
      "default": "Medium"
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "description": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ]
}