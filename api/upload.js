import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || "{}"); } catch {}
        const expected = process.env.ADMIN_PASSWORD;
        if (!expected || payload.password !== expected) {
          throw new Error("غير مصرح: تحقق من كلمة مرور لوحة التحكم ومتغير ADMIN_PASSWORD في Vercel");
        }
        return {
          allowedContentTypes: [
            "audio/mpeg", "audio/mp4", "audio/aac", "audio/wav",
            "audio/ogg", "audio/flac", "audio/x-m4a", "audio/webm"
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ authorized: true })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Audio upload completed:", blob.pathname);
      }
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Blob upload error:", error);
    return res.status(400).json({ error: error.message || "Upload failed" });
  }
}
