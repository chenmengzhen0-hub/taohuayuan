// Vercel Serverless Function：图片生成代理转发
// 作用：让 https 的 app 通过本接口请求 http 的图像站，绕开浏览器混合内容拦截
//
// 放置位置：你的 GitHub 项目里的 api/ 目录下，即 api/img-proxy.js
// 部署后访问地址：https://你的域名/api/img-proxy
//
// app 设置里「图像接口地址」改填：
//   https://taohuayuan-five.vercel.app/api/img-proxy
// 「图像 API Key」照旧填图像站给的 key。

export const config = {
  maxDuration: 300, // 生图较慢，给到5分钟上限
};

// 上游图像站根地址（http）
const UPSTREAM = 'http://dreamworld-ai.live:3000';

export default async function handler(req, res) {
  // CORS（同域其实不需要，但留着以防你换域名调试）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Only POST' }); return; }

  // 客户端通过 ?path= 指定要转发到的上游路径
  // 文生图: ?path=/v1/images/generations
  // 图生图: ?path=/v1/images/edits
  const path = (req.query.path || '/v1/images/generations').toString();
  const target = UPSTREAM + path;

  try {
    const auth = req.headers['authorization'] || '';
    const contentType = req.headers['content-type'] || '';

    let body;
    const headers = { 'Authorization': auth };

    if (contentType.includes('application/json')) {
      // 文生图：JSON 透传
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body);
    } else {
      // 图生图（multipart）：把原始请求体原样转发
      // Vercel 默认会解析 body，这里需要拿原始 buffer
      headers['Content-Type'] = contentType;
      body = await rawBody(req);
    }

    const upstreamResp = await fetch(target, { method: 'POST', headers, body });
    const text = await upstreamResp.text();

    res.status(upstreamResp.status);
    res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: { message: 'proxy failed: ' + e.message } });
  }
}

// 读取原始请求体（用于 multipart 透传）
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// 对 multipart 关闭 Vercel 自动 body 解析，保证原始体能透传
export const bodyParser = false;
