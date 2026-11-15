import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  const FILENAME = 'alminbar-data.json';

  try {
    // قراءة البيانات عند فتح الموقع
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: FILENAME });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url, { cache: 'no-store' });
        const data = await response.json();
        return res.status(200).json(data);
      }
      return res.status(200).json([]);
    }

    // حفظ البيانات عند التعديل أو الإضافة من لوحة الإدارة
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      const blob = await put(FILENAME, JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, url: blob.url });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
