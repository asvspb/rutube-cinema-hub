import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

const isPrivateIP = ip => {
  if (ip === '::1') return true;
  const parts = ip.split(':');

  if (parts[0] === '' && parts[1] === '') {
    if (ip.startsWith('::1') && ip !== '::1') return true;
    if (ip.startsWith('::ffff:127.')) return true;
    if (
      ip.startsWith('::ffff:192.168.') ||
      ip.startsWith('::ffff:10.') ||
      ip.startsWith('::ffff:172.')
    ) {
      return true;
    }
  }

  if (parts.length > 2) {
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
    if (ip.startsWith('fe80')) return true;
    if (ip.startsWith('::1')) return true;
  } else {
    const cleanIP = parts[0];
    if (cleanIP.startsWith('10.')) return true;
    if (
      cleanIP.startsWith('172.') &&
      parseInt(cleanIP.split('.')[1], 10) >= 16 &&
      parseInt(cleanIP.split('.')[1], 10) <= 31
    ) {
      return true;
    }
    if (cleanIP.startsWith('192.168.')) return true;
    if (cleanIP.startsWith('127.')) return true;
    if (cleanIP.startsWith('0.')) return true;
    if (cleanIP.startsWith('fc') || cleanIP.startsWith('fd')) return true;
    if (cleanIP.startsWith('fe80')) return true;
  }

  return false;
};

const isAllowedDomain = (hostname, allowedDomains) => {
  for (const allowedDomain of allowedDomains) {
    if (allowedDomain.startsWith('*.')) {
      const domainPattern = allowedDomain.substring(2);
      if (hostname === domainPattern || hostname.endsWith(`.${domainPattern}`)) {
        return true;
      }
    } else if (hostname === allowedDomain) {
      return true;
    }
  }
  return false;
};

export const validateAndResolveURL = async (urlString, allowedDomains) => {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname;

    if (hostname === 'localhost') {
      throw new Error('Hostname "localhost" is not allowed');
    }

    if (isPrivateIP(hostname)) {
      throw new Error(`Resolved IP '${hostname}' is a private IP address`);
    }

    if (!isAllowedDomain(hostname, allowedDomains)) {
      throw new Error(`Domain '${hostname}' is not in the allowed domains list`);
    }

    const resolved = await dnsLookup(hostname);
    if (isPrivateIP(resolved.address)) {
      throw new Error(`Resolved IP '${resolved.address}' is a private IP address`);
    }

    return parsedUrl;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Hostname could not be resolved: ${urlString}`);
    }
    throw error;
  }
};
