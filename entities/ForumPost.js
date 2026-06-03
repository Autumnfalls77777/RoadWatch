{
  "name": "ForumPost",
  "type": "object",
  "properties": {
    "forum_id": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "is_anonymous": {
      "type": "boolean",
      "default": false
    },
    "author_name": {
      "type": "string"
    },
    "author_level": {
      "type": "string"
    },
    "media_urls": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "upvotes": {
      "type": "number",
      "default": 0
    },
    "is_pinned": {
      "type": "boolean",
      "default": false
    },
    "post_type": {
      "type": "string",
      "enum": [
        "Discussion",
        "Update",
        "Alert",
        "Question",
        "Review"
      ],
      "default": "Discussion"
    }
  },
  "required": [
    "forum_id",
    "content"
  ]
}