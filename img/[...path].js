// Vercel 动态路由代理：放在 api/img/[...path].js
// 部署后地址：https://taohuayuan-five.vercel.app/api/img/v1/images/generations
//                                                  /api/img/v1/images/edits
//
// app 设置「图像接口地址」填：
//   https://taohuayuan-five.vercel.app/api/img
// （后面的 /v1/images/... 由 app 自动拼，不要手填）

export const config = {
  api: { bodyParser: false }, // 关闭解析，原始体透传（支持 multipart 图生图）
  maxDuration: 300,
};

const UPSTREAM = 'http://dreamworld-ai.live:3000';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Only POST' }); return; }

  // 动态路由：/api/img/v1/images/generations → path = ['v1','images','generations']
  const parts = req.query.path || [];
  const upstreamPath = '/' + (Array.isArray(parts) ? parts.join('/') : parts);
  const target = UPSTREAM + upstreamPath;

  try {
    const headers = {
      'Authorization': req.headers['authorization'] || '',
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    const body = await rawBody(req); // 原始体，JSON 和 multipart 都原样转发

    const upstreamResp = await fetch(target, { method: 'POST', headers, body });
    const buf = Buffer.from(await upstreamResp.arrayBuffer());

    res.status(upstreamResp.status);
    res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'application/json');
    res.send(buf);
  } catch (e) {
    res.status(502).json({ error: { message: 'proxy failed: ' + e.message } });
  }
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
