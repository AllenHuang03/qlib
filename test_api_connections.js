#!/usr/bin/env node
/**
 * API Connection Test Suite
 * Validates all API endpoints and WebSocket connections
 */

const https = require('https');
const WebSocket = require('ws');

// Configuration
const BACKEND_URL = 'https://qlib-production-b7f5.up.railway.app';
const WS_URL = 'wss://qlib-production-b7f5.up.railway.app';

console.log('🔍 API Connection Test Suite');
console.log('============================');

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Helper function to test WebSocket
function testWebSocket(url) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                ws.terminate();
                resolve({ success: false, error: 'Timeout' });
                resolved = true;
            }
        }, 5000);
        
        ws.on('open', () => {
            if (!resolved) {
                clearTimeout(timeout);
                ws.close();
                resolve({ success: true });
                resolved = true;
            }
        });
        
        ws.on('error', (error) => {
            if (!resolved) {
                clearTimeout(timeout);
                resolve({ success: false, error: error.message });
                resolved = true;
            }
        });
    });
}

// Test suite
async function runTests() {
    const tests = [
        {
            name: 'Backend Root',
            url: `${BACKEND_URL}/`,
            expected: 200
        },
        {
            name: 'API Health',
            url: `${BACKEND_URL}/api/health`,
            expected: 200
        },
        {
            name: 'Market Quotes',
            url: `${BACKEND_URL}/api/market/quotes`,
            expected: 200
        },
        {
            name: 'Historical Data',
            url: `${BACKEND_URL}/api/market/historical/CBA.AX`,
            expected: 200
        },
        {
            name: 'Live Historical Data',
            url: `${BACKEND_URL}/api/market/live/historical/CBA.AX?days=30`,
            expected: 200
        },
        {
            name: 'Market Indicators',
            url: `${BACKEND_URL}/api/market/indicators/CBA.AX`,
            expected: 200
        },
        {
            name: 'Multi-Asset Symbols',
            url: `${BACKEND_URL}/api/market/multi-asset/symbols`,
            expected: 200
        }
    ];

    console.log('🚀 Testing HTTP Endpoints...\n');
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            
            const result = await makeRequest(test.url);
            const status = result.statusCode === test.expected ? '✅ PASS' : '❌ FAIL';
            
            console.log(`   Status: ${result.statusCode} ${status}`);
            
            if (result.statusCode === 200 && result.data) {
                try {
                    const json = JSON.parse(result.data);
                    console.log(`   Response: ${Object.keys(json).join(', ')}`);
                } catch (e) {
                    console.log(`   Response: ${result.data.substring(0, 100)}...`);
                }
            } else if (result.statusCode !== 200) {
                console.log(`   Error: ${result.statusCode} - ${result.data.substring(0, 200)}`);
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ FAIL - Error: ${error.message}\n`);
        }
    }

    // Test WebSocket
    console.log('🔌 Testing WebSocket Connections...\n');
    
    const wsTests = [
        {
            name: 'Live Market WebSocket',
            url: `${WS_URL}/ws/live-market`
        }
    ];

    for (const test of wsTests) {
        console.log(`📡 Testing: ${test.name}`);
        console.log(`   URL: ${test.url}`);
        
        const result = await testWebSocket(test.url);
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        
        console.log(`   Connection: ${status}`);
        if (!result.success) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    }

    console.log('🏁 Test Suite Complete!');
}

// Run tests
runTests().catch(console.error);