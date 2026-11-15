import { handleUpload } from "@vercel/blob/client";

const ADMIN_PASSWORD = "1234560";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = null; }
    }

    if (!body || typeof body !== "object" || !body.type || !body.payload) {
      return res.status(400).json({ error: "طلب رمز الرفع غير صحيح" });
    }

    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || "{}"); }
        catch { throw new Error("clientPayload غير صالح"); }

        if (payload.password !== ADMIN_PASSWORD) {
          throw new Error("كلمة مرور لوحة التحكم غير صحيحة");
        }

        return {
          allowedContentTypes: [
            "audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac",
            "audio/wav", "audio/x-wav", "audio/ogg", "audio/flac",
            "audio/x-m4a", "audio/webm", "audio/3gpp", "audio/amr",
            "audio/midi", "audio/x-midi", "audio/aiff", "audio/x-aiff",
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "image/svg+xml", "image/bmp", "image/avif", "image/heic",
            "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
            "application/pdf", "application/octet-stream"
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: JSON.stringify({ authorized: true })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob upload completed:", blob?.pathname || "unknown");
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error?.message || String(error);
    console.error("Blob upload handler failed:", message, error?.stack || "");
    return res.status(400).json({
      error: message,
      hint: "راجع Runtime Logs لمسار /api/upload"
    });
  }
}