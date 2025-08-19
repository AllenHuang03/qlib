#!/usr/bin/env node
/**
 * Simple API Connection Test
 * Tests HTTP endpoints only
 */

const https = require('https');

// Configuration
const BACKEND_URL = 'https://qlib-production-b7f5.up.railway.app';

console.log('🔍 API Connection Test');
console.log('=====================');

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

// Test suite
async function runTests() {
    const tests = [
        {
            name: 'Backend Root',
            url: `${BACKEND_URL}/`,
        },
        {
            name: 'API Health',
            url: `${BACKEND_URL}/api/health`,
        },
        {
            name: 'Market Quotes',
            url: `${BACKEND_URL}/api/market/quotes`,
        },
        {
            name: 'Historical Data (CBA.AX)',
            url: `${BACKEND_URL}/api/market/historical/CBA.AX`,
        },
        {
            name: 'Live Historical Data (CBA.AX, 30 days)',
            url: `${BACKEND_URL}/api/market/live/historical/CBA.AX?days=30`,
        },
        {
            name: 'Market Indicators (CBA.AX)',
            url: `${BACKEND_URL}/api/market/indicators/CBA.AX`,
        },
        {
            name: 'Multi-Asset Symbols',
            url: `${BACKEND_URL}/api/market/multi-asset/symbols`,
        }
    ];

    console.log('🚀 Testing HTTP Endpoints...\n');
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        try {
            console.log(`📡 ${test.name}`);
            console.log(`   ${test.url}`);
            
            const result = await makeRequest(test.url);
            
            if (result.statusCode === 200) {
                console.log(`   ✅ PASS (${result.statusCode})`);
                passed++;
                
                try {
                    const json = JSON.parse(result.data);
                    const keys = Object.keys(json);
                    console.log(`   📦 Response: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
                } catch (e) {
                    console.log(`   📦 Response: ${result.data.substring(0, 50)}...`);
                }
            } else {
                console.log(`   ❌ FAIL (${result.statusCode})`);
                if (result.data) {
                    console.log(`   🔍 Error: ${result.data.substring(0, 100)}...`);
                }
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ FAIL - Network Error: ${error.message}\n`);
        }
    }

    console.log(`🏁 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All API endpoints are working correctly!');
    } else {
        console.log(`⚠️  ${total - passed} endpoint(s) need attention.`);
    }
}

// Run tests
runTests().catch(console.error);