"""
Tilt API Backend Tests
Tests for:
- GET /api/health - Health check endpoint
- POST /api/analyze-screen - Screen analysis with Claude vision
- POST /api/generate-decisions - Decision generation with Claude
"""
import pytest
import requests
import os
import base64
from io import BytesIO

# Use localhost for backend testing to avoid proxy issues with large payloads
BASE_URL = "http://localhost:8001"

class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_200(self):
        """GET /api/health should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✓ Health endpoint returned 200")
        
    def test_health_response_structure(self):
        """Health response should have status and timestamp"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "timestamp" in data
        print(f"✓ Health response structure valid: {data}")


class TestAnalyzeScreenEndpoint:
    """Screen analysis endpoint tests - POST /api/analyze-screen"""
    
    def _create_test_image_base64(self):
        """Create a simple test image with real visual features (not blank)"""
        # Create a simple PNG with a gradient pattern (has visual features)
        from PIL import Image
        import io
        
        # Create 100x100 image with gradient pattern
        img = Image.new('RGB', (100, 100))
        pixels = img.load()
        for i in range(100):
            for j in range(100):
                # Create a gradient with some variation
                r = int((i / 100) * 255)
                g = int((j / 100) * 255)
                b = int(((i + j) / 200) * 255)
                pixels[i, j] = (r, g, b)
        
        # Add some shapes for visual features
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([20, 20, 80, 80], outline=(255, 0, 0), width=2)
        draw.ellipse([30, 30, 70, 70], fill=(0, 0, 255))
        
        # Convert to JPEG base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    def test_analyze_screen_accepts_base64_image(self):
        """POST /api/analyze-screen should accept base64 JPEG image"""
        image_base64 = self._create_test_image_base64()
        
        response = requests.post(
            f"{BASE_URL}/api/analyze-screen",
            json={"image_base64": image_base64},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Analyze screen endpoint accepted base64 image")
        
    def test_analyze_screen_response_structure(self):
        """Response should have 'context' and 'activity' fields"""
        image_base64 = self._create_test_image_base64()
        
        response = requests.post(
            f"{BASE_URL}/api/analyze-screen",
            json={"image_base64": image_base64},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "context" in data, "Response missing 'context' field"
        assert "activity" in data, "Response missing 'activity' field"
        assert isinstance(data["context"], str), "context should be a string"
        assert isinstance(data["activity"], str), "activity should be a string"
        print(f"✓ Analyze screen response structure valid: context='{data['context'][:50]}...', activity='{data['activity']}'")
    
    def test_analyze_screen_with_data_uri_prefix(self):
        """Should handle base64 with data URI prefix"""
        image_base64 = self._create_test_image_base64()
        image_with_prefix = f"data:image/jpeg;base64,{image_base64}"
        
        response = requests.post(
            f"{BASE_URL}/api/analyze-screen",
            json={"image_base64": image_with_prefix},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "context" in data
        assert "activity" in data
        print(f"✓ Analyze screen handles data URI prefix correctly")
    
    def test_analyze_screen_missing_image(self):
        """Should return 422 for missing image_base64"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-screen",
            json={},
            timeout=30
        )
        
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print(f"✓ Analyze screen returns 422 for missing image_base64")


class TestGenerateDecisionsEndpoint:
    """Decision generation endpoint tests - POST /api/generate-decisions"""
    
    def test_generate_decisions_basic(self):
        """POST /api/generate-decisions should work with basic input"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={"input_text": "My boss asked me to work overtime this weekend but I have family plans"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Generate decisions endpoint returned 200")
    
    def test_generate_decisions_response_structure(self):
        """Response should have safe/smart/bold/reasoning JSON structure"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={"input_text": "A colleague took credit for my work in a meeting"},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level keys
        assert "safe" in data, "Response missing 'safe' field"
        assert "smart" in data, "Response missing 'smart' field"
        assert "bold" in data, "Response missing 'bold' field"
        assert "reasoning" in data, "Response missing 'reasoning' field"
        
        # Check each decision has response, label, description
        for decision_type in ["safe", "smart", "bold"]:
            decision = data[decision_type]
            assert "response" in decision, f"{decision_type} missing 'response'"
            assert "label" in decision, f"{decision_type} missing 'label'"
            assert isinstance(decision["response"], str), f"{decision_type} response should be string"
            print(f"  ✓ {decision_type}: {decision['response'][:50]}...")
        
        # Check reasoning structure
        reasoning = data["reasoning"]
        assert "safe" in reasoning, "reasoning missing 'safe'"
        assert "smart" in reasoning, "reasoning missing 'smart'"
        assert "bold" in reasoning, "reasoning missing 'bold'"
        
        print(f"✓ Generate decisions response structure valid")
    
    def test_generate_decisions_with_context(self):
        """Should work with screen context from vision analysis"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={
                "input_text": "How should I respond to this email?",
                "context": "User is viewing an email from their manager about project deadlines"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "safe" in data
        assert "smart" in data
        assert "bold" in data
        print(f"✓ Generate decisions works with screen context")
    
    def test_generate_decisions_with_preferences(self):
        """Should work with user_preference and tone_traits"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={
                "input_text": "Client is asking for a discount on our services",
                "user_preference": "bold",
                "tone_traits": ["Direct", "Confident"]
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "safe" in data
        assert "smart" in data
        assert "bold" in data
        print(f"✓ Generate decisions works with user preferences and tone traits")
    
    def test_generate_decisions_with_all_params(self):
        """Should work with all parameters combined"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={
                "input_text": "Team member missed another deadline",
                "context": "User is in Slack messaging app, viewing a conversation with their team",
                "user_preference": "smart",
                "tone_traits": ["Balanced", "Professional"]
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify all decision types present
        assert all(key in data for key in ["safe", "smart", "bold", "reasoning"])
        
        # Verify responses are non-empty
        for decision_type in ["safe", "smart", "bold"]:
            assert len(data[decision_type].get("response", "")) > 0, f"{decision_type} response is empty"
        
        print(f"✓ Generate decisions works with all parameters combined")
    
    def test_generate_decisions_missing_input_text(self):
        """Should return 422 for missing input_text"""
        response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={},
            timeout=30
        )
        
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print(f"✓ Generate decisions returns 422 for missing input_text")


class TestIntegrationFlow:
    """Integration tests combining analyze-screen and generate-decisions"""
    
    def _create_test_image_base64(self):
        """Create a simple test image with real visual features"""
        from PIL import Image
        from PIL import ImageDraw
        import io
        
        img = Image.new('RGB', (200, 150), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        
        # Draw some shapes to simulate a screen
        draw.rectangle([10, 10, 190, 30], fill=(50, 50, 50))  # Title bar
        draw.rectangle([10, 35, 190, 140], fill=(255, 255, 255))  # Content area
        draw.text((20, 50), "Email: Meeting Tomorrow", fill=(0, 0, 0))
        draw.text((20, 70), "Hi, can we reschedule?", fill=(100, 100, 100))
        
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    def test_full_flow_analyze_then_decide(self):
        """Test full flow: analyze screen -> use context in decisions"""
        # Step 1: Analyze screen
        image_base64 = self._create_test_image_base64()
        
        analyze_response = requests.post(
            f"{BASE_URL}/api/analyze-screen",
            json={"image_base64": image_base64},
            timeout=60
        )
        
        assert analyze_response.status_code == 200, f"Analyze failed: {analyze_response.text}"
        screen_data = analyze_response.json()
        
        context = screen_data.get("context", "")
        activity = screen_data.get("activity", "")
        print(f"  Screen analysis: context='{context[:50]}...', activity='{activity}'")
        
        # Step 2: Use context in decision generation
        decision_response = requests.post(
            f"{BASE_URL}/api/generate-decisions",
            json={
                "input_text": "How should I respond?",
                "context": context
            },
            timeout=60
        )
        
        assert decision_response.status_code == 200, f"Decision failed: {decision_response.text}"
        decisions = decision_response.json()
        
        assert "safe" in decisions
        assert "smart" in decisions
        assert "bold" in decisions
        
        print(f"✓ Full integration flow works: analyze screen -> generate decisions")
        print(f"  Safe: {decisions['safe'].get('response', '')[:50]}...")
        print(f"  Smart: {decisions['smart'].get('response', '')[:50]}...")
        print(f"  Bold: {decisions['bold'].get('response', '')[:50]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
