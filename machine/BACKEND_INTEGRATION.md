## Machine Learning Setup - Easy Backend Integration

### Quick Start

1. **Install dependencies:**
   ```bash
   pip install python-dotenv ultralytics
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update paths as needed

3. **Test the detector:**
   ```bash
   python test.py
   ```

---

### For Backend/Frontend Integration

#### Option 1: Simple Function Call (Recommended for REST API)
```python
from detector import detect_potholes

result = detect_potholes('./path/to/image.jpg')
# Returns: {'success': True, 'detections': 5, 'output_path': '...', 'boxes': [...]}
```

#### Option 2: Class-Based (For Persistent Model)
```python
from detector import PotholeDetector

detector = PotholeDetector(model_path='./outputs/best.pt', confidence=0.25)

# Run multiple detections without reloading model
result = detector.detect('./image.jpg')
```

#### Option 3: Override Settings
```python
from detector import detect_potholes

result = detect_potholes(
    image_path='./test.jpg',
    confidence=0.3,           # Custom threshold
    model_path='./custom.pt', # Custom model
    output_dir='./results'    # Custom output directory
)
```

---

### Environment Variables (.env)

```
MODEL_PATH              - Path to YOLO model file
IMAGE_PATH              - Default test image path
OUTPUT_DIR              - Where detection results are saved
CONFIDENCE              - Detection confidence threshold (0.0-1.0)
PROJECT_NAME            - Results subdirectory name
WORKING_DIR             - Working directory (optional)
```

---

### Backend Examples

**Flask/Django:**
```python
from flask import Flask, request
from detector import detect_potholes

@app.route('/detect', methods=['POST'])
def detect():
    image_path = request.json.get('image_path')
    confidence = float(request.json.get('confidence', 0.25))
    
    result = detect_potholes(image_path, confidence=confidence)
    return result
```

**FastAPI:**
```python
from fastapi import FastAPI
from detector import detect_potholes

@app.post("/detect")
def detect(image_path: str, confidence: float = 0.25):
    result = detect_potholes(image_path, confidence=confidence)
    return result
```

---

### File Structure
- `detector.py` - Main detection service/API
- `test.py` - Simple test script
- `.env` - Configuration (local, don't commit)
- `.env.example` - Template (commit this)
- `example_usage.py` - Usage examples
