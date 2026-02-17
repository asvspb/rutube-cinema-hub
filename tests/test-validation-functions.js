// Test script to verify security functions

// Since we can't directly import from server/index.js due to how it's structured,
// let's create the validation functions here for testing purposes

// Function to check if an IP is private/local
function isPrivateIP(ip) {
  // Special handling for exact IPv6 localhost
  if (ip === '::1') return true;

  // For IPv6 addresses with ports like ::1:8080, extract the IP part
  // Split by ':' and handle the parts appropriately
  const parts = ip.split(':');

  // If it starts with '::', handle specially
  if (parts[0] === '' && parts[1] === '') {
    // This is an IPv6 address starting with '::'
    // For ::1 specifically, we already handled it above
    // For other cases like ::ffff:127.0.0.1, check the full address
    if (ip.startsWith('::1') && ip !== '::1') {
      // This is ::1 followed by something else, which is still localhost
      return true;
    }
    if (ip.startsWith('::ffff:127.')) {
      // IPv4-mapped IPv6 address for localhost
      return true;
    }
    if (
      ip.startsWith('::ffff:192.168.') ||
      ip.startsWith('::ffff:10.') ||
      ip.startsWith('::ffff:172.')
    ) {
      // IPv4-mapped IPv6 addresses for private ranges
      return true;
    }
  }

  // For other addresses, extract the base IP without port
  // If there are more than 2 colons, it's likely IPv6
  if (parts.length > 2) {
    // This is likely an IPv6 address
    // Handle compressed format and extract the base address
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // unique local addresses
    if (ip.startsWith('fe80')) return true; // link-local addresses
    if (ip.startsWith('::1')) return true; // localhost IPv6
  } else {
    // This is likely IPv4 or IPv4-like
    const cleanIP = parts[0];

    // IPv4 private ranges
    if (cleanIP.startsWith('10.')) return true;
    if (
      cleanIP.startsWith('172.') &&
      parseInt(cleanIP.split('.')[1], 10) >= 16 &&
      parseInt(cleanIP.split('.')[1], 10) <= 31
    )
      return true;
    if (cleanIP.startsWith('192.168.')) return true;
    if (cleanIP.startsWith('127.')) return true;
    if (cleanIP.startsWith('0.')) return true;

    // IPv6 private ranges (when extracted without the :: issue)
    if (cleanIP.startsWith('fc') || cleanIP.startsWith('fd')) return true; // unique local addresses
    if (cleanIP.startsWith('fe80')) return true; // link-local addresses
  }

  return false;
}

// Function to check if hostname is in allowed domains
function isAllowedDomain(hostname) {
  const ALLOWED_DOMAINS = ['rutube.ru', '*.rutube.ru', 'api.rutube.ru'];

  for (const allowedDomain of ALLOWED_DOMAINS) {
    if (allowedDomain.startsWith('*.')) {
      // Wildcard domain check (e.g., *.rutube.ru)
      const domainPattern = allowedDomain.substring(2); // Remove '*.'
      if (hostname === domainPattern || hostname.endsWith('.' + domainPattern)) {
        return true;
      }
    } else {
      // Exact domain match
      if (hostname === allowedDomain) {
        return true;
      }
    }
  }
  return false;
}

console.log('Testing security functions...\n');

// Test isPrivateIP function
console.log('Testing isPrivateIP function:');
console.log('127.0.0.1 is private:', isPrivateIP('127.0.0.1')); // Should be true
console.log('192.168.1.1 is private:', isPrivateIP('192.168.1.1')); // Should be true
console.log('10.0.0.1 is private:', isPrivateIP('10.0.0.1')); // Should be true
console.log('172.16.0.1 is private:', isPrivateIP('172.16.0.1')); // Should be true
console.log('8.8.8.8 is private:', isPrivateIP('8.8.8.8')); // Should be false
console.log('::1 is private:', isPrivateIP('::1')); // Should be true
console.log('fc00::1 is private:', isPrivateIP('fc00::1')); // Should be true
console.log('');

// Test isAllowedDomain function
console.log('Testing isAllowedDomain function:');
console.log('rutube.ru is allowed:', isAllowedDomain('rutube.ru')); // Should be true
console.log('api.rutube.ru is allowed:', isAllowedDomain('api.rutube.ru')); // Should be true
console.log('video.rutube.ru is allowed:', isAllowedDomain('video.rutube.ru')); // Should be true (matches *.rutube.ru)
console.log('google.com is allowed:', isAllowedDomain('google.com')); // Should be false
console.log('youtube.com is allowed:', isAllowedDomain('youtube.com')); // Should be false
console.log('');

console.log('All tests completed!');
