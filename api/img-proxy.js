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
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Only POST' }); return; }

  try {
    const incoming = req.body || {};
    const upstreamPath = incoming.__path || '/v1/images/generations';
    const payload = { ...incoming };
    delete payload.__path;

    const target = UPSTREAM + upstreamPath;
    const upstreamResp = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: JSON.stringify(payload),
    });

    const text = await upstreamResp.text();
    res.status(upstreamResp.status);
    res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: { message: 'proxy failed: ' + e.message } });
  }
};

module.exports.config = {
  maxDuration: 300,
};
