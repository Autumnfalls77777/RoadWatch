from detector import detect_potholes
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get image path from .env
image_path = os.getenv('IMAGE_PATH', './testing/sample_image.jpeg')

# Run detection
result = detect_potholes(image_path)

# Print results
print(f"Number of detections: {result['detections']}")
print(f"Result saved to: {result['output_path']}")