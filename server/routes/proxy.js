import { Router } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';
import { validateAndResolveURL } from '../middleware/validation.js';

const REQUEST_TIMEOUT_MS = parseInt(process.env.PROXY_REQUEST_TIMEOUT_MS) || 30000; // Reduced to 30s
const CONNECT_TIMEOUT_MS = 5000;
const DEBUG = process.env.PROXY_DEBUG === 'true'; // Enable via environment variable

const dnsLookup = promisify(dns.lookup);

// Helper to make HTTPS requests with IPv4 support and retry logic
const makeRequest = async (urlString, options, maxRetries = 2) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const parsedUrl = new URL(urlString);
      const isHttps = parsedUrl.protocol === 'https:';

      if (DEBUG) {
        console.log('[PROXY] Attempt', attempt, 'requesting:', urlString);
      }

      // Resolve hostname to IPv4 with timeout
      const ipv4Address = await Promise.race([
        dnsLookup(parsedUrl.hostname, { family: 4 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DNS timeout')), CONNECT_TIMEOUT_MS)
        ),
      ]);

      if (DEBUG) {
        console.log('[PROXY] Resolved:', parsedUrl.hostname, '->', ipv4Address.address);
      }

      const result = await Promise.race([
        new Promise((resolve, reject) => {
          const reqOptions = {
            hostname: ipv4Address.address,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
              ...options.headers,
              Host: parsedUrl.hostname,
            },
            timeout: REQUEST_TIMEOUT_MS,
            rejectUnauthorized: true,
          };

          const lib = isHttps ? https : http;
          const req = lib.request(reqOptions, res => {
            if (DEBUG) {
              console.log('[PROXY] Response status:', res.statusCode);
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: Buffer.concat(chunks),
              });
            });
          });

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          if (options.body) {
            req.write(options.body);
          }
          req.end();
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            CONNECT_TIMEOUT_MS + REQUEST_TIMEOUT_MS
          )
        ),
      ]);

      return result;
    } catch (e) {
      lastError = e;
      if (DEBUG) {
        console.log('[PROXY] Attempt', attempt, 'failed:', e.message);
      }
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError;
};

const forwardProxyRequest = async (urlString, init, allowedDomains, maxRedirects) => {
  let currentUrl = urlString;
  let response;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await validateAndResolveURL(currentUrl, allowedDomains);

    response = await makeRequest(currentUrl, init);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) {
        return response;
      }

      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = nextUrl;
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
};

export const proxyRouter = ({ proxyLimiter, allowedDomains, maxRedirects }) => {
  const router = Router();

  router.get('/api/proxy', proxyLimiter, async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    try {
      const response = await forwardProxyRequest(
        targetUrl,
        {
          method: req.method,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/html, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            Referer: 'https://rutube.ru/',
            Origin: 'https://rutube.ru',
          },
        },
        allowedDomains,
        maxRedirects
      );

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      res.status(response.status);

      Object.entries(response.headers).forEach(([key, value]) => {
        if (
          key.toLowerCase() !== 'access-control-allow-origin' &&
          key.toLowerCase() !== 'content-security-policy' &&
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'content-encoding'
        ) {
          res.setHeader(key, value);
        }
      });

      res.send(response.body);
    } catch (e) {
      console.error('Proxy request error:', e);
      if (
        e.message.includes('not in the allowed domains list') ||
        e.message.includes('private IP address') ||
        e.message.includes('Hostname "localhost"') ||
        e.message.includes('Too many redirects')
      ) {
        res.status(403).json({ error: e.message });
      } else if (e.message.includes('Too many requests')) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        res.status(500).json({ error: 'Proxy request failed', details: e.message });
      }
    }
  });

  return router;
};
