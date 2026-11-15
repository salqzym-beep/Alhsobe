
import { put, list } from "@vercel/blob";

const FILE_NAME = "quran-site-data.json";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { blobs } = await list({ prefix: FILE_NAME });

      if (!blobs.length) {
        return res.status(200).json(null);
      }

      const response = await fetch(blobs[0].url);
      const data = await response.json();

      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const data = req.body;

      await put(FILE_NAME, JSON.stringify(data), {
        access: "public",
        allowOverwrite: true,
        contentType: "application/json",
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
