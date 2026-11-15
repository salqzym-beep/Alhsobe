import { put, list } from '@vercel/blob';

const DB_FILENAME = 'db/minbar-data.json';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: DB_FILENAME });
      if (blobs.length === 0) {
        return res.status(200).json({ reciters: [], items: [] });
      }
      const response = await fetch(blobs[0].url, { cache: 'no-store' });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'فشل جلب البيانات' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (req.headers['x-admin-pass'] !== '771993753') {
        return res.status(401).json({ error: 'غير مصرح' });
      }
      const blob = await put(DB_FILENAME, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json'
      });
      return res.status(200).json({ success: true, url: blob.url });
    } catch (e) {
      return res.status(500).json({ error: 'فشل حفظ البيانات' });
    }
  }
}
