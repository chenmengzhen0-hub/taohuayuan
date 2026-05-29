// api/models.js
const UPSTREAM = 'http://dreamworld-ai.live:3000';

module.exports = async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Only GET allowed' });
    return;
  }

  try {
    const target = `${UPSTREAM}/v1/models`;
    console.log(`[Models Proxy] GET -> ${target}`);
    
    const headers = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    const upstreamResp = await fetch(target, {
      method: 'GET',
      headers: headers,
    });
    
    const data = await upstreamResp.json();
    
    res.status(upstreamResp.status);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
    
  } catch (e) {
    console.error('[Models Proxy Error]', e);
    res.status(502).json({ error: { message: 'Proxy failed: ' + e.message } });
  }
};

module.exports.config = {
  maxDuration: 10,
};
