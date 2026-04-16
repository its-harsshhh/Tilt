"""
Tilt API Backend Tests
Tests for:
- GET /api/health - Health check endpoint
- POST /api/analyze-screen - Screen analysis with Claude vision
- POST /api/generate-decisions - Decision generation with Claude
- POST /api/assist - Conversational AI assistant
- POST /api/guide-step - Step-by-step screen guidance (NEW in iteration 5)
"""
import pytest
import requests
import os
import base64
from io import BytesIO

# Use localhost for backend testing to avoid proxy issues with large payloads
BASE_URL = "http://localhost:8001"


def create_test_ui_image_base64():
    """Create a test image simulating a UI with buttons/elements for guide-step testing"""
    from PIL import Image, ImageDraw
    import io
    
    # Create 800x600 image simulating a UI
    img = Image.new('RGB', (800, 600), color=(240, 240, 245))
    draw = ImageDraw.Draw(img)
    
    # Draw a header bar
    draw.rectangle([0, 0, 800, 50], fill=(30, 30, 40))
    draw.text((20, 15), "GitHub - Settings", fill=(255, 255, 255))
    
    # Draw navigation tabs
    draw.rectangle([100, 60, 180, 90], fill=(200, 200, 210))
    draw.text((110, 68), "General", fill=(50, 50, 50))
    
    draw.rectangle([190, 60, 280, 90], fill=(100, 100, 200))  # Active tab
    draw.text((200, 68), "Settings", fill=(255, 255, 255))
    
    draw.rectangle([290, 60, 380, 90], fill=(200, 200, 210))
    draw.text((300, 68), "Security", fill=(50, 50, 50))
    
    # Draw sidebar
    draw.rectangle([0, 100, 150, 600], fill=(245, 245, 250))
    draw.text((20, 120), "Profile", fill=(80, 80, 80))
    draw.text((20, 150), "Account", fill=(80, 80, 80))
    draw.text((20, 180), "Notifications", fill=(80, 80, 80))
    draw.text((20, 210), "Danger Zone", fill=(200, 50, 50))
    
    # Draw main content area
    draw.rectangle([160, 100, 790, 590], fill=(255, 255, 255))
    draw.text((180, 120), "Repository Settings", fill=(30, 30, 30))
    
    # Draw a delete button in danger zone
    draw.rectangle([180, 500, 350, 540], fill=(220, 50, 50))
    draw.text((200, 512), "Delete Repository", fill=(255, 255, 255))
    
    # Convert to JPEG base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')

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


class TestAssistEndpoint:
    """Conversational AI assistant endpoint tests - POST /api/assist"""
    
    def test_assist_basic_message(self):
        """POST /api/assist should accept a basic message and return response"""
        response = requests.post(
            f"{BASE_URL}/api/assist",
            json={"message": "Hello, can you help me write an email?"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "response" in data, "Response missing 'response' field"
        assert "mode" in data, "Response missing 'mode' field"
        assert data["mode"] == "chat", f"Expected mode 'chat', got '{data['mode']}'"
        assert isinstance(data["response"], str), "response should be a string"
        assert len(data["response"]) > 0, "response should not be empty"
        
        print(f"✓ Assist endpoint returned valid response: {data['response'][:80]}...")
    
    def test_assist_with_screen_context(self):
        """POST /api/assist should use screen_context in its response"""
        response = requests.post(
            f"{BASE_URL}/api/assist",
            json={
                "message": "What should I do next?",
                "screen_context": "User is viewing a Slack conversation with their manager about a project deadline that was missed"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "response" in data
        assert "mode" in data
        assert data["mode"] == "chat"
        assert len(data["response"]) > 0
        
        print(f"✓ Assist endpoint uses screen context: {data['response'][:80]}...")
    
    def test_assist_with_conversation_history(self):
        """POST /api/assist should support conversation continuation"""
        # First message
        response1 = requests.post(
            f"{BASE_URL}/api/assist",
            json={"message": "I need help writing a professional email to decline a meeting invitation"},
            timeout=60
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        first_response = data1["response"]
        
        # Follow-up message with conversation history
        response2 = requests.post(
            f"{BASE_URL}/api/assist",
            json={
                "message": "Can you make it shorter and more direct?",
                "conversation": [
                    {"role": "user", "content": "I need help writing a professional email to decline a meeting invitation"},
                    {"role": "assistant", "content": first_response}
                ]
            },
            timeout=60
        )
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        data2 = response2.json()
        
        assert "response" in data2
        assert "mode" in data2
        assert data2["mode"] == "chat"
        assert len(data2["response"]) > 0
        
        print(f"✓ Assist endpoint supports conversation continuation")
        print(f"  First response: {first_response[:60]}...")
        print(f"  Follow-up response: {data2['response'][:60]}...")
    
    def test_assist_with_all_parameters(self):
        """POST /api/assist should work with all parameters"""
        response = requests.post(
            f"{BASE_URL}/api/assist",
            json={
                "message": "How should I respond to this?",
                "screen_context": "User is viewing an email from a client asking for a discount",
                "conversation": [
                    {"role": "user", "content": "I got a difficult email from a client"},
                    {"role": "assistant", "content": "I can help you craft a response. What's the situation?"}
                ],
                "mode": "chat",
                "user_preference": "bold",
                "tone_traits": ["Direct", "Confident", "Professional"]
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "response" in data
        assert "mode" in data
        assert data["mode"] == "chat"
        assert len(data["response"]) > 0
        
        print(f"✓ Assist endpoint works with all parameters: {data['response'][:80]}...")
    
    def test_assist_missing_message(self):
        """POST /api/assist should return 422 for missing message"""
        response = requests.post(
            f"{BASE_URL}/api/assist",
            json={},
            timeout=30
        )
        
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print(f"✓ Assist endpoint returns 422 for missing message")


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


class TestGuideStepEndpoint:
    """Step-by-step screen guidance endpoint tests - POST /api/guide-step (NEW)"""
    
    def test_guide_step_basic(self):
        """POST /api/guide-step should accept image and task, return guidance"""
        image_base64 = create_test_ui_image_base64()
        
        response = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_base64,
                "task": "Delete this repository",
                "completed_steps": [],
                "step_number": 1
            },
            timeout=90
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "instruction" in data, "Response missing 'instruction' field"
        assert "detail" in data, "Response missing 'detail' field"
        assert "region" in data, "Response missing 'region' field"
        assert "is_complete" in data, "Response missing 'is_complete' field"
        assert "step_summary" in data, "Response missing 'step_summary' field"
        assert "step_number" in data, "Response missing 'step_number' field"
        
        print(f"✓ Guide step endpoint returned valid response")
        print(f"  Instruction: {data['instruction'][:80]}...")
        print(f"  Region: {data['region']}")
    
    def test_guide_step_region_coordinates(self):
        """POST /api/guide-step should return region with x, y coordinates (0-1 range)"""
        image_base64 = create_test_ui_image_base64()
        
        response = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_base64,
                "task": "Click on the Settings tab",
                "completed_steps": [],
                "step_number": 1
            },
            timeout=90
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        region = data.get("region", {})
        assert "x" in region, "Region missing 'x' coordinate"
        assert "y" in region, "Region missing 'y' coordinate"
        assert "label" in region, "Region missing 'label'"
        
        # Verify coordinates are in 0-1 range (normalized)
        x = region["x"]
        y = region["y"]
        assert isinstance(x, (int, float)), f"x should be numeric, got {type(x)}"
        assert isinstance(y, (int, float)), f"y should be numeric, got {type(y)}"
        assert 0 <= x <= 1, f"x coordinate {x} should be between 0 and 1"
        assert 0 <= y <= 1, f"y coordinate {y} should be between 0 and 1"
        
        print(f"✓ Guide step returns valid region coordinates")
        print(f"  x={x}, y={y}, label='{region.get('label', '')}'")
    
    def test_guide_step_with_completed_steps(self):
        """POST /api/guide-step should advance through steps with completed_steps"""
        image_base64 = create_test_ui_image_base64()
        
        # First step
        response1 = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_base64,
                "task": "Delete this repository",
                "completed_steps": [],
                "step_number": 1
            },
            timeout=90
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        step1_summary = data1.get("step_summary", "Step 1")
        
        # Second step with completed_steps
        response2 = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_base64,
                "task": "Delete this repository",
                "completed_steps": [step1_summary],
                "step_number": 2
            },
            timeout=90
        )
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        data2 = response2.json()
        
        assert data2["step_number"] == 2, f"Expected step_number 2, got {data2['step_number']}"
        assert "instruction" in data2
        
        print(f"✓ Guide step advances correctly with completed_steps")
        print(f"  Step 1: {step1_summary}")
        print(f"  Step 2: {data2.get('step_summary', 'N/A')}")
    
    def test_guide_step_is_complete_flag(self):
        """POST /api/guide-step should return is_complete boolean"""
        image_base64 = create_test_ui_image_base64()
        
        response = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_base64,
                "task": "Click the Settings tab",
                "completed_steps": [],
                "step_number": 1
            },
            timeout=90
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "is_complete" in data, "Response missing 'is_complete' field"
        assert isinstance(data["is_complete"], bool), f"is_complete should be boolean, got {type(data['is_complete'])}"
        
        print(f"✓ Guide step returns is_complete flag: {data['is_complete']}")
    
    def test_guide_step_with_data_uri_prefix(self):
        """POST /api/guide-step should handle base64 with data URI prefix"""
        image_base64 = create_test_ui_image_base64()
        image_with_prefix = f"data:image/jpeg;base64,{image_base64}"
        
        response = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={
                "image_base64": image_with_prefix,
                "task": "Navigate to settings",
                "completed_steps": [],
                "step_number": 1
            },
            timeout=90
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "instruction" in data
        assert "region" in data
        
        print(f"✓ Guide step handles data URI prefix correctly")
    
    def test_guide_step_missing_required_fields(self):
        """POST /api/guide-step should return 422 for missing required fields"""
        # Missing image_base64
        response1 = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={"task": "Delete repo"},
            timeout=30
        )
        assert response1.status_code == 422, f"Expected 422 for missing image_base64, got {response1.status_code}"
        
        # Missing task
        image_base64 = create_test_ui_image_base64()
        response2 = requests.post(
            f"{BASE_URL}/api/guide-step",
            json={"image_base64": image_base64},
            timeout=30
        )
        assert response2.status_code == 422, f"Expected 422 for missing task, got {response2.status_code}"
        
        print(f"✓ Guide step returns 422 for missing required fields")


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
