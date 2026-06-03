{
  "name": "Notification",
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "complaint_update",
        "upvote_milestone",
        "forum_created",
        "assignment",
        "system",
        "achievement"
      ]
    },
    "priority": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high",
        "critical"
      ],
      "default": "low"
    },
    "title": {
      "type": "string"
    },
    "body": {
      "type": "string"
    },
    "is_read": {
      "type": "boolean",
      "default": false
    },
    "action_url": {
      "type": "string"
    },
    "complaint_id": {
      "type": "string"
    },
    "road_id": {
      "type": "string"
    }
  },
  "required": [
    "title",
    "body"
  ]
}