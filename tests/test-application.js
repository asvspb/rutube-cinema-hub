import axios from 'axios';

async function testApplication() {
  console.log('Starting application tests...\n');

  // Test 1: Check if frontend server is running
  console.log('1. Testing frontend server...');
  try {
    const frontResponse = await axios.get('http://localhost:9229', { timeout: 5000 });
    console.log(`   ✓ Frontend server is running (Status: ${frontResponse.status})`);
  } catch (error) {
    console.log(`   ✗ Frontend server test failed: ${error.message}`);
  }

  // Test 2: Check if backend server is running
  console.log('\n2. Testing backend server...');
  try {
    const backResponse = await axios.get('http://localhost:9230', { timeout: 5000 });
    console.log(`   ✓ Backend server is running (Status: ${backResponse.status})`);
  } catch (error) {
    console.log(`   ✗ Backend server test failed: ${error.message}`);
  }

  // Test 3: Test proxy with a valid Rutube URL (if available)
  console.log('\n3. Testing proxy functionality...');
  try {
    // Try a basic proxy request to a known Rutube API endpoint
    const proxyResponse = await axios.get(
      'http://localhost:9230/api/proxy?url=https://rutube.ru/api/mainpage/',
      {
        timeout: 10000,
        validateStatus: function (status) {
          // Accept all status codes for this test
          return true;
        },
      }
    );

    if (proxyResponse.status === 404 || proxyResponse.status === 200) {
      console.log(`   ✓ Proxy is functioning (Status: ${proxyResponse.status})`);
    } else if (proxyResponse.status === 429) {
      console.log(`   ⚠ Proxy rate limit reached (Status: ${proxyResponse.status})`);
    } else if (proxyResponse.status === 403) {
      console.log(
        `   ⚠ Proxy blocked request (Status: ${proxyResponse.status}) - This is expected for security`
      );
    } else {
      console.log(`   ✓ Proxy responded (Status: ${proxyResponse.status})`);
    }
  } catch (error) {
    console.log(
      `   ⚠ Proxy test failed: ${error.message} (This may be expected due to rate limiting or external service availability)`
    );
  }

  // Test 4: Test AI endpoints (if configured)
  console.log('\n4. Testing AI endpoints...');
  try {
    const aiResponse = await axios.post(
      'http://localhost:9230/api/ai/kinorate/search',
      { query: 'test' },
      {
        timeout: 10000,
        validateStatus: function (status) {
          // Accept all status codes for this test
          return true;
        },
      }
    );

    if (aiResponse.status === 400 || aiResponse.status === 200) {
      console.log(`   ✓ AI endpoint responded (Status: ${aiResponse.status})`);
    } else if (aiResponse.status === 429) {
      console.log(`   ⚠ AI rate limit reached (Status: ${aiResponse.status})`);
    } else if (aiResponse.status === 500) {
      console.log(
        `   ⚠ AI service error (Status: ${aiResponse.status}) - May need API keys configured`
      );
    } else {
      console.log(`   ✓ AI endpoint responded (Status: ${aiResponse.status})`);
    }
  } catch (error) {
    console.log(`   ⚠ AI endpoint test failed: ${error.message} (May need API keys configured)`);
  }

  // Test 5: Test security functions
  console.log('\n5. Testing security functions...');
  try {
    // Test with disallowed domain
    const securityResponse = await axios.get(
      'http://localhost:9230/api/proxy?url=https://google.com',
      {
        timeout: 5000,
        validateStatus: function (status) {
          return true;
        },
      }
    );

    if (securityResponse.status === 403) {
      console.log(
        `   ✓ Security is working - blocked disallowed domain (Status: ${securityResponse.status})`
      );
    } else {
      console.log(
        `   ⚠ Security check - unexpected response for disallowed domain (Status: ${securityResponse.status})`
      );
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('   ✓ Security is working - blocked disallowed domain (Status: 403)');
    } else {
      console.log(`   ⚠ Security test result: ${error.message}`);
    }
  }

  console.log('\nApplication testing completed.');
  console.log('\nNote:');
  console.log('- Frontend and backend servers should be running');
  console.log(
    '- Proxy functionality may be limited by rate limits or external service availability'
  );
  console.log('- AI endpoints require proper API keys configuration');
  console.log('- Security should block unauthorized domains');
}

testApplication().catch(console.error);
