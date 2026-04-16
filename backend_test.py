import requests
import sys
import json
from datetime import datetime

class TiltAPITester:
    def __init__(self, base_url="https://tilt-decide.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test the health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_generate_decisions_endpoint(self):
        """Test the generate decisions endpoint"""
        test_data = {
            "input_text": "I need to respond to a client who is asking for a refund on a product they bought 6 months ago",
            "context": "Working on customer service",
            "user_preference": None,
            "tone_traits": None
        }
        
        return self.run_test(
            "Generate Decisions",
            "POST",
            "api/generate-decisions",
            200,
            data=test_data,
            timeout=60  # LLM calls can take longer
        )

    def test_generate_decisions_with_preferences(self):
        """Test generate decisions with user preferences"""
        test_data = {
            "input_text": "How should I ask my boss for a raise?",
            "context": "Working",
            "user_preference": "bold",
            "tone_traits": ["Direct", "Confident"]
        }
        
        return self.run_test(
            "Generate Decisions with Preferences",
            "POST",
            "api/generate-decisions",
            200,
            data=test_data,
            timeout=60
        )

    def test_generate_decisions_minimal(self):
        """Test generate decisions with minimal data"""
        test_data = {
            "input_text": "Should I take this job offer?"
        }
        
        return self.run_test(
            "Generate Decisions (Minimal)",
            "POST",
            "api/generate-decisions",
            200,
            data=test_data,
            timeout=60
        )

    def test_generate_decisions_empty_input(self):
        """Test generate decisions with empty input"""
        test_data = {
            "input_text": ""
        }
        
        # This should still work as the backend doesn't validate empty strings
        return self.run_test(
            "Generate Decisions (Empty Input)",
            "POST",
            "api/generate-decisions",
            200,
            data=test_data,
            timeout=60
        )

    def validate_decision_response(self, response_data):
        """Validate the structure of decision response"""
        required_fields = ['safe', 'smart', 'bold', 'reasoning']
        
        print("\n🔍 Validating decision response structure...")
        
        for field in required_fields:
            if field not in response_data:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Check each decision type has required subfields
        for decision_type in ['safe', 'smart', 'bold']:
            decision = response_data.get(decision_type, {})
            required_subfields = ['response', 'label', 'description']
            
            for subfield in required_subfields:
                if subfield not in decision:
                    print(f"❌ Missing {subfield} in {decision_type} decision")
                    return False
        
        # Check reasoning has entries for each type
        reasoning = response_data.get('reasoning', {})
        for decision_type in ['safe', 'smart', 'bold']:
            if decision_type not in reasoning:
                print(f"❌ Missing reasoning for {decision_type}")
                return False
        
        print("✅ Decision response structure is valid")
        return True

def main():
    print("🚀 Starting Tilt API Tests")
    print("=" * 50)
    
    # Setup
    tester = TiltAPITester()
    
    # Test health endpoint
    health_success, health_data = tester.test_health_endpoint()
    
    if not health_success:
        print("\n❌ Health check failed - backend may be down")
        print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
        return 1
    
    # Test decision generation endpoints
    decision_success, decision_data = tester.test_generate_decisions_endpoint()
    
    if decision_success and decision_data:
        # Validate the response structure
        if not tester.validate_decision_response(decision_data):
            print("❌ Decision response validation failed")
            return 1
    
    # Test with preferences
    pref_success, pref_data = tester.test_generate_decisions_with_preferences()
    
    # Test minimal input
    minimal_success, minimal_data = tester.test_generate_decisions_minimal()
    
    # Test empty input
    empty_success, empty_data = tester.test_generate_decisions_empty_input()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())