import { Router } from 'express';
import { validateAndResolveURL } from '../middleware/validation.js';

const forwardProxyRequest = async (urlString, init, allowedDomains, maxRedirects) => {
  let currentUrl = urlString;
  let response;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await validateAndResolveURL(currentUrl, allowedDomains);

    response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
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

      for (const [key, value] of response.headers.entries()) {
        if (
          key.toLowerCase() !== 'access-control-allow-origin' &&
          key.toLowerCase() !== 'content-security-policy' &&
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'content-encoding'
        ) {
          res.setHeader(key, value);
        }
      }

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
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
