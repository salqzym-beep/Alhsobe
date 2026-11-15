import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    let body = req.body;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    if (!body || typeof body !== "object" || !body.type || !body.payload) {
      return res.status(400).json({
        error: "طلب رمز الرفع غير صحيح"
      });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error("ADMIN_PASSWORD is missing");

      return res.status(500).json({
        error: "ADMIN_PASSWORD غير موجود في Vercel"
      });
    }

    const result = await handleUpload({
      body,
      request: req,

      onBeforeGenerateToken: async (
        pathname,
        clientPayload,
        multipart
      ) => {
        let payload = {};

        try {
          payload = JSON.parse(clientPayload || "{}");
        } catch {
          throw new Error("clientPayload غير صالح");
        }

        if (payload.password !== expectedPassword) {
          throw new Error(
            "كلمة مرور لوحة التحكم لا تطابق ADMIN_PASSWORD"
          );
        }

        return {
          allowedContentTypes: [
            "audio/*",
            "image/*",
            "video/*",
            "application/pdf",
            "application/octet-stream"
          ],

          addRandomSuffix: true,

          maximumSizeInBytes: 500 * 1024 * 1024,

          tokenPayload: JSON.stringify({
            authorized: true
          })
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log(
          "Blob upload completed:",
          blob?.pathname || "unknown"
        );
      }
    });

    return res.status(200).json(result);

  } catch (error) {
    const message = error?.message || String(error);

    console.error(
      "Blob upload handler failed:",
      message,
      error?.stack || ""
    );

    return res.status(400).json({
      error: message,
      hint: "راجع Runtime Logs لمسار /api/upload"
    });
  }
}
