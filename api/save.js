import { put, list } from "@vercel/blob";

const FILE_NAME = "quran-site-data.json";

export default async function handler(req, res) {
  try {
    // قراءة البيانات
    if (req.method === "GET") {
      const { blobs } = await list({
        prefix: FILE_NAME,
      });

      if (!blobs || blobs.length === 0) {
        return res.status(200).json(null);
      }

      const matchingBlobs = blobs.filter(
        (blob) =>
          blob.pathname === FILE_NAME ||
          blob.pathname?.startsWith(FILE_NAME)
      );

      const candidates = matchingBlobs.length
        ? matchingBlobs
        : blobs;

      candidates.sort(
        (a, b) =>
          new Date(b.uploadedAt || 0).getTime() -
          new Date(a.uploadedAt || 0).getTime()
      );

      const latestBlob = candidates[0];

      const response = await fetch(latestBlob.url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to read Blob: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      return res.status(200).json(data);
    }

    // حفظ البيانات
    if (req.method === "POST") {
      const data = req.body;

      if (!data || typeof data !== "object") {
        return res.status(400).json({
          error: "Invalid data",
        });
      }

      await put(
        FILE_NAME,
        JSON.stringify(data),
        {
          access: "public",
          allowOverwrite: true,
          contentType: "application/json",
        }
      );

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
