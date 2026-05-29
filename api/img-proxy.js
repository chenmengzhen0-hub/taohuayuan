// Vercel 图片代理（CJS版）：放在 api/img-proxy.js
// 部署后地址：https://taohuayuan-five.vercel.app/api/img-proxy
//
// app 设置「图像接口地址」填：
//   https://taohuayuan-five.vercel.app/api/img-proxy

const UPSTREAM = 'http://dreamworld-ai.live:3000';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST' });
    return;
  }

  try {
    const body = req.body || {};
    let upstreamPath = body.__path || '/v1/images/generations';
    
    // 删除 __path 字段，避免传给上游
    delete body.__path;
    
    const target = UPSTREAM + upstreamPath;
    console.log(`[Proxy] ${req.method} -> ${target}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    const upstreamResp = await fetch(target, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    
    const data = await upstreamResp.text();
    res.status(upstreamResp.status);
    res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'application/json');
    res.send(data);
    
  } catch (e) {
    console.error('[Proxy Error]', e);
    res.status(502).json({ error: { message: 'Proxy failed: ' + e.message } });
  }
};

module.exports.config = {
  maxDuration: 300,
};
