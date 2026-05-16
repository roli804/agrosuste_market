import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy serverless para PaysGator — mantém a API Key no servidor (nunca exposta ao cliente)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.PAYSGATOR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'PAYSGATOR_API_KEY não configurada no servidor.' });
  }

  const slugParts = req.query.slug as string[];
  const path = slugParts ? slugParts.join('/') : '';
  const targetUrl = `https://paysgator.com/api/v1/${path}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(upstream.status).json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, message: `Erro de proxy: ${err.message}` });
  }
}
