"""
Example usage for backend/API integration
"""
from detector import PotholeDetector, detect_potholes

# Method 1: Simple function (quickest)
# Just pass image path, everything else uses .env defaults
result = detect_potholes('./testing/sample_image.jpeg')
print(result)

# Method 2: Class-based (more control)
detector = PotholeDetector(
    model_path='./outputs/best.pt',
    confidence=0.3,
    output_dir='./runs'
)

# Run multiple detections with same model instance (faster)
result1 = detector.detect('./testing/image1.jpg', project_name='detection_1')
result2 = detector.detect('./testing/image2.jpg', project_name='detection_2')
print(result1, result2)

# Method 3: Override individual parameters
result = detect_potholes(
    image_path='./testing/sample_image.jpeg',
    confidence=0.4,  # Custom threshold
    output_dir='./custom_results'
)
print(result)
