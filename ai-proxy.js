/*
  大学生工作台 · AI 本地中转（可选）
  Developed by @赛博老爸

  有些 AI 服务不允许网页直接调用（浏览器跨域限制），可以用这个小程序在本机中转一下。
  用法：
    1. 电脑装好 Node.js（18 或更新版本）
    2. 在这个文件所在的文件夹打开终端，运行：node ai-proxy.js
    3. 工作台「设置 → AI 接口」里，把接口地址改成 http://127.0.0.1:8787/ 加上原来的地址
       例如：http://127.0.0.1:8787/https://api.deepseek.com
  只监听本机（127.0.0.1），不会对外开放；不保存任何内容。
*/
const http = require('http');
const https = require('https');
const PORT = 8787;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
}

http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const target = decodeURIComponent(req.url.slice(1));
  let url;
  try { url = new URL(target); } catch (e) { url = null; }
  if (!url || url.protocol !== 'https:') {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('用法：http://127.0.0.1:' + PORT + '/https://目标接口地址');
    return;
  }
  const headers = Object.assign({}, req.headers);
  delete headers.host; delete headers.origin; delete headers.referer;
  ['sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'].forEach((k) => delete headers[k]);
  const up = https.request(url, { method: req.method, headers }, (r) => {
    const h = Object.assign({}, r.headers);
    delete h['access-control-allow-origin'];
    res.writeHead(r.statusCode || 502, h);
    r.pipe(res);
  });
  up.on('error', (e) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('中转失败：' + e.message);
  });
  req.pipe(up);
}).listen(PORT, '127.0.0.1', () => {
  console.log('AI 中转已启动：http://127.0.0.1:' + PORT + '/');
  console.log('在工作台里把接口地址写成：http://127.0.0.1:' + PORT + '/https://api.deepseek.com （换成你用的服务商）');
  console.log('按 Ctrl + C 停止');
});
