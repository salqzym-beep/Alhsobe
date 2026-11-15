import { put, list } from "@vercel/blob";

const FILE_NAME = "quran-site-data.json";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { blobs } = await list({ prefix: FILE_NAME });
      const candidates = (blobs || []).filter(blob => blob.pathname === FILE_NAME);
      if (!candidates.length) return res.status(200).json(null);
      candidates.sort((a,b) => new Date(b.uploadedAt || 0)-new Date(a.uploadedAt || 0));
      const response = await fetch(candidates[0].url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to read Blob data: HTTP ${response.status}`);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json(await response.json());
    }

    if (req.method === "POST") {
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "Invalid data body" });
      }
      await put(FILE_NAME, JSON.stringify(data), {
        access: "public",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 0
      });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
