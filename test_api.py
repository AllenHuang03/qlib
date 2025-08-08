#!/usr/bin/env python3
"""
Test backend API endpoints directly
"""
import requests
import json

def test_api():
    base_url = 'http://localhost:8003/api'
    
    # Test login
    print("Testing login...")
    login_data = {'email': 'demo@qlib.com', 'password': 'demo123'}
    response = requests.post(f'{base_url}/auth/login', json=login_data)
    print('Login Status:', response.status_code)
    
    if response.status_code == 200:
        token = response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print('Token received:', token[:50] + '...')
        
        # Test models GET
        print("\nTesting models GET...")
        response = requests.get(f'{base_url}/models', headers=headers)
        print('Models GET Status:', response.status_code)
        if response.status_code != 200:
            print('Models GET Error:', response.text)
        else:
            print('Models data received:', len(response.json()), 'models')
        
        # Test model creation
        print("\nTesting model creation...")
        model_data = {
            'name': 'Test Model',
            'type': 'LightGBM', 
            'description': 'Test model'
        }
        response = requests.post(f'{base_url}/models', json=model_data, headers=headers)
        print('Models POST Status:', response.status_code)
        if response.status_code != 200 and response.status_code != 201:
            print('Models POST Error:', response.text)
        else:
            print('Model created successfully!')
    else:
        print('Login Error:', response.text)

if __name__ == "__main__":
    test_api()