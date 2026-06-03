{
  "name": "UserProfile",
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    },
    "display_name": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "avatar_url": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "citizen",
        "field_officer",
        "road_inspector",
        "executive_engineer",
        "district_authority",
        "state_authority",
        "super_admin"
      ],
      "default": "citizen"
    },
    "level": {
      "type": "string",
      "enum": [
        "Road Scout",
        "Road Reporter",
        "Road Guardian",
        "Road Inspector",
        "Road Champion"
      ],
      "default": "Road Scout"
    },
    "points": {
      "type": "number",
      "default": 0
    },
    "total_reports": {
      "type": "number",
      "default": 0
    },
    "verified_reports": {
      "type": "number",
      "default": 0
    },
    "forum_posts": {
      "type": "number",
      "default": 0
    },
    "district": {
      "type": "string"
    },
    "state": {
      "type": "string"
    },
    "bio": {
      "type": "string"
    },
    "notifications_email": {
      "type": "boolean",
      "default": true
    },
    "notifications_whatsapp": {
      "type": "boolean",
      "default": false
    },
    "notifications_sms": {
      "type": "boolean",
      "default": false
    }
  },
  "required": []
}