{
  "name": "Forum",
  "type": "object",
  "properties": {
    "road_id": {
      "type": "string"
    },
    "road_name": {
      "type": "string"
    },
    "complaint_id": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "Active",
        "Resolved",
        "Archived"
      ],
      "default": "Active"
    },
    "post_count": {
      "type": "number",
      "default": 0
    },
    "participant_count": {
      "type": "number",
      "default": 0
    },
    "district": {
      "type": "string"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "title"
  ]
}