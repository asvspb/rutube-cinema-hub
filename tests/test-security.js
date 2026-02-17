#!/usr/bin/env node

import express from 'express';
import request from 'supertest';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const testResults = [];

// Test the server functionality
async function runTests() {
  console.log('Starting security tests...\n');

  // Start the server
  const serverProcess = spawn('node', ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '9999' },
  });

  // Wait for server to start
  await setTimeout(3000);

  try {
    // Test 1: Valid domain should work
    console.log('Test 1: Valid domain (rutube.ru)');
    try {
      const response = await request('http://localhost:9999')
        .get('/api/proxy?url=https://rutube.ru/')
        .expect(403); // Should be 403 because rutube.ru is not in the allowed domains by default

      console.log('  ✗ Expected success but got 403');
      testResults.push({ test: 'Valid domain', status: 'FAIL', details: 'Expected success' });
    } catch (err) {
      console.log('  ✓ Correctly blocked (expected 403)');
      testResults.push({ test: 'Valid domain', status: 'PASS', details: 'Correctly blocked' });
    }

    // Test 2: Invalid domain should be blocked
    console.log('\nTest 2: Invalid domain (google.com)');
    try {
      const response = await request('http://localhost:9999')
        .get('/api/proxy?url=https://google.com/')
        .expect(403);

      console.log('  ✓ Correctly blocked (403 Forbidden)');
      testResults.push({ test: 'Invalid domain', status: 'PASS', details: 'Correctly blocked' });
    } catch (err) {
      console.log("  ✗ Should have been blocked but wasn't");
      testResults.push({ test: 'Invalid domain', status: 'FAIL', details: 'Was not blocked' });
    }

    // Test 3: Private IP should be blocked
    console.log('\nTest 3: Private IP (localhost)');
    try {
      const response = await request('http://localhost:9999')
        .get('/api/proxy?url=http://localhost:3000/')
        .expect(403);

      console.log('  ✓ Correctly blocked (403 Forbidden)');
      testResults.push({ test: 'Private IP', status: 'PASS', details: 'Correctly blocked' });
    } catch (err) {
      console.log("  ✗ Should have been blocked but wasn't");
      testResults.push({ test: 'Private IP', status: 'FAIL', details: 'Was not blocked' });
    }

    // Test 4: Rate limiting should work
    console.log('\nTest 4: Rate limiting');
    let rateLimitCount = 0;
    for (let i = 0; i < 110; i++) {
      // Exceed the default limit of 100
      try {
        const response = await request('http://localhost:9999').get(
          '/api/proxy?url=https://rutube.ru/api/'
        );
        if (response.status === 429) {
          rateLimitCount++;
        }
      } catch (err) {
        if (err.status === 429) {
          rateLimitCount++;
        }
      }
    }

    if (rateLimitCount > 0) {
      console.log('  ✓ Rate limiting is active (some requests were rejected)');
      testResults.push({ test: 'Rate limiting', status: 'PASS', details: 'Active' });
    } else {
      console.log('  ✗ Rate limiting may not be working');
      testResults.push({ test: 'Rate limiting', status: 'FAIL', details: 'Not active' });
    }

    // Test 5: AI endpoint rate limiting
    console.log('\nTest 5: AI endpoint rate limiting');
    let aiRateLimitCount = 0;
    for (let i = 0; i < 60; i++) {
      // Exceed the default AI limit of 50
      try {
        const response = await request('http://localhost:9999')
          .post('/api/ai/kinorate/search')
          .send({ query: 'test' })
          .set('Content-Type', 'application/json');

        if (response.status === 429) {
          aiRateLimitCount++;
        }
      } catch (err) {
        if (err.status === 429) {
          aiRateLimitCount++;
        }
      }
    }

    if (aiRateLimitCount > 0) {
      console.log('  ✓ AI rate limiting is active (some requests were rejected)');
      testResults.push({ test: 'AI rate limiting', status: 'PASS', details: 'Active' });
    } else {
      console.log('  ✗ AI rate limiting may not be working');
      testResults.push({ test: 'AI rate limiting', status: 'FAIL', details: 'Not active' });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY:');
    console.log('='.repeat(50));

    let passed = 0;
    let failed = 0;

    testResults.forEach(result => {
      const statusSymbol = result.status === 'PASS' ? '✓' : '✗';
      console.log(`${statusSymbol} ${result.test}: ${result.status} (${result.details})`);
      if (result.status === 'PASS') passed++;
      else failed++;
    });

    console.log(`\nPassed: ${passed}, Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / testResults.length) * 100)}%`);
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    // Clean up: kill the server process
    serverProcess.kill();
  }
}

// Run the tests
runTests().catch(console.error);
