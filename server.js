import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9230; // Using a different port than the frontend

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'error_logs.json');

// Helper to write logs
const writeLog = (logEntry) => {
  try {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      logs = JSON.parse(content || '[]');
    }
    logs.push({
      timestamp: new Date().toISOString(),
      ...logEntry
    });
    // Keep only last 1000 logs
    if (logs.length > 1000) logs = logs.slice(-1000);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to write log:', e);
  }
};

// Logging endpoint
app.post('/api/logs', (req, res) => {
  const logEntry = req.body;
  console.log('[CLIENT LOG]', logEntry);
  writeLog(logEntry);
  res.status(200).json({ status: 'ok' });
});

// Define the proxy route for Rutube API calls
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Validate that the target URL is from rutube.ru domain
    if (!parsedTarget.hostname.endsWith('.rutube.ru') && parsedTarget.hostname !== 'rutube.ru') {
      res.status(403).json({ error: 'Only rutube.ru domains are allowed' });
      return;
    }

    // Make the actual request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://rutube.ru/',
        'Origin': 'https://rutube.ru'
      }
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    // Forward response status and headers
    res.status(response.status);

    // Forward response headers (except those that might conflict)
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== 'access-control-allow-origin' && 
          key.toLowerCase() !== 'content-security-policy' &&
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    }

    // Send the response body
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('Proxy request error:', e);
    res.status(500).json({ error: 'Proxy request failed', details: e.message });
  }
});

// Serve static files from the dist directory if in production mode
app.use(express.static('dist'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rutube Cinema Hub Proxy Server running on port ${PORT}`);
  console.log(`Proxy endpoint available at http://localhost:${PORT}/api/proxy`);
});