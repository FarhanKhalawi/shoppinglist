#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ShoppingListAPITester:
    def __init__(self, base_url="https://liste-mutaqabila.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_list_id = None
        self.test_item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Response: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET", 
            "/",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_email = f"test_user_{timestamp}@test.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": f"Test User {timestamp}"
            }
        )
        
        if success and response.get('token'):
            self.token = response['token']
            self.user_data = response.get('user', {})
            print(f"✅ Registration successful. Token acquired.")
            return True
        return False

    def test_login(self):
        """Test user login with existing account"""
        if not self.user_data:
            print("❌ No user data from registration, cannot test login")
            return False
            
        success, response = self.run_test(
            "User Login",
            "POST",
            "/auth/login",
            200,
            data={
                "email": self.user_data.get('email'),
                "password": "TestPass123!"
            }
        )
        
        if success and response.get('token'):
            self.token = response['token']
            print(f"✅ Login successful")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "/auth/me",
            200
        )
        return success and response.get('user_id') is not None

    def test_create_list(self):
        """Test creating a shopping list"""
        success, response = self.run_test(
            "Create Shopping List",
            "POST",
            "/lists",
            200,
            data={"name": "Test Shopping List"}
        )
        
        if success and response.get('id'):
            self.test_list_id = response['id']
            print(f"✅ List created with ID: {self.test_list_id}")
            return True
        return False

    def test_get_lists(self):
        """Test getting all shopping lists"""
        success, response = self.run_test(
            "Get Shopping Lists",
            "GET",
            "/lists",
            200
        )
        return success and isinstance(response, list)

    def test_get_list_by_id(self):
        """Test getting specific shopping list"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Get List by ID",
            "GET",
            f"/lists/{self.test_list_id}",
            200
        )
        return success and response.get('id') == self.test_list_id

    def test_update_list(self):
        """Test updating shopping list"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Update Shopping List",
            "PUT",
            f"/lists/{self.test_list_id}",
            200,
            data={"name": "Updated Test List"}
        )
        return success and response.get('name') == "Updated Test List"

    def test_create_item(self):
        """Test creating an item in the shopping list"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Create List Item",
            "POST",
            f"/lists/{self.test_list_id}/items",
            200,
            data={
                "name": "Test Item",
                "quantity": 2.5,
                "unit": "kg",
                "category": "fruits",
                "note": "Test note"
            }
        )
        
        if success and response.get('id'):
            self.test_item_id = response['id']
            print(f"✅ Item created with ID: {self.test_item_id}")
            return True
        return False

    def test_get_items(self):
        """Test getting items from shopping list"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Get List Items",
            "GET",
            f"/lists/{self.test_list_id}/items",
            200
        )
        return success and isinstance(response, list)

    def test_update_item(self):
        """Test updating an item"""
        if not self.test_list_id or not self.test_item_id:
            print("❌ No test list/item ID available")
            return False
            
        success, response = self.run_test(
            "Update Item",
            "PUT",
            f"/lists/{self.test_list_id}/items/{self.test_item_id}",
            200,
            data={
                "name": "Updated Test Item",
                "is_done": True,
                "quantity": 3.0
            }
        )
        return success and response.get('name') == "Updated Test Item"

    def test_bulk_mark_done(self):
        """Test marking all items as done"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Mark All Items Done",
            "POST",
            f"/lists/{self.test_list_id}/mark-all-done",
            200
        )
        return success

    def test_bulk_clear_done(self):
        """Test clearing purchased items"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Clear Done Items",
            "POST",
            f"/lists/{self.test_list_id}/clear-done",
            200
        )
        return success

    def test_export_data(self):
        """Test exporting user data"""
        success, response = self.run_test(
            "Export Data",
            "GET",
            "/export",
            200
        )
        return success and 'lists' in response and 'items' in response

    def test_import_data(self):
        """Test importing user data"""
        import_data = {
            "lists": [
                {
                    "id": "import_test_list",
                    "name": "Imported Test List"
                }
            ],
            "items": [
                {
                    "id": "import_test_item", 
                    "list_id": "import_test_list",
                    "name": "Imported Item",
                    "is_done": False
                }
            ]
        }
        
        success, response = self.run_test(
            "Import Data", 
            "POST",
            "/import",
            200,
            data=import_data
        )
        return success

    def test_delete_item(self):
        """Test deleting an item"""
        if not self.test_list_id or not self.test_item_id:
            print("❌ No test list/item ID available")
            return False
            
        success, response = self.run_test(
            "Delete Item",
            "DELETE",
            f"/lists/{self.test_list_id}/items/{self.test_item_id}",
            200
        )
        return success

    def test_delete_list(self):
        """Test deleting shopping list"""
        if not self.test_list_id:
            print("❌ No test list ID available")
            return False
            
        success, response = self.run_test(
            "Delete Shopping List",
            "DELETE",
            f"/lists/{self.test_list_id}",
            200
        )
        return success

    def test_logout(self):
        """Test user logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "/auth/logout",
            200
        )
        if success:
            self.token = None
        return success

def main():
    print("🚀 Starting Shopping List API Tests...")
    print(f"Target: https://liste-mutaqabila.preview.emergentagent.com")
    
    tester = ShoppingListAPITester()
    
    # Run all tests in sequence
    test_results = []
    
    # Basic API tests
    test_results.append(("Root Endpoint", tester.test_root_endpoint()))
    
    # Auth tests  
    test_results.append(("User Registration", tester.test_register()))
    test_results.append(("User Login", tester.test_login()))
    test_results.append(("Get Current User", tester.test_get_me()))
    
    # Shopping List CRUD tests
    test_results.append(("Create Shopping List", tester.test_create_list()))
    test_results.append(("Get All Lists", tester.test_get_lists()))
    test_results.append(("Get List by ID", tester.test_get_list_by_id()))
    test_results.append(("Update List", tester.test_update_list()))
    
    # Item CRUD tests
    test_results.append(("Create Item", tester.test_create_item()))
    test_results.append(("Get Items", tester.test_get_items()))
    test_results.append(("Update Item", tester.test_update_item()))
    
    # Bulk operations
    test_results.append(("Mark All Done", tester.test_bulk_mark_done()))
    test_results.append(("Clear Done Items", tester.test_bulk_clear_done()))
    
    # Data operations
    test_results.append(("Export Data", tester.test_export_data()))
    test_results.append(("Import Data", tester.test_import_data()))
    
    # Cleanup tests
    test_results.append(("Delete Item", tester.test_delete_item()))
    test_results.append(("Delete List", tester.test_delete_list()))
    test_results.append(("Logout", tester.test_logout()))
    
    # Print final results
    print(f"\n" + "="*60)
    print(f"📊 FINAL TEST RESULTS")
    print(f"="*60)
    
    passed_count = 0
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed_count += 1
    
    print(f"\n📈 Tests passed: {passed_count}/{len(test_results)}")
    success_rate = (passed_count / len(test_results)) * 100
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend APIs are working well!")
        return 0
    elif success_rate >= 50:
        print("⚠️ Backend has some issues but basic functionality works")
        return 1
    else:
        print("🚨 Backend has major issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())