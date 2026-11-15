import { put, list } from "@vercel/blob";

const FILE_NAME = "quran-site-data.json";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    // GET: قراءة البيانات المحفوظة
    if (req.method === "GET") {
      const { blobs } = await list({
        prefix: FILE_NAME,
      });

      if (!blobs || blobs.length === 0) {
        return res.status(200).json(null);
      }

      // الأولوية للملف الثابت باسمه
      let target = blobs.find(
        (blob) => blob.pathname === FILE_NAME
      );

      // إذا لم يوجد، نختار أحدث ملف قديم يحمل الاسم المشابه
      if (!target) {
        const candidates = blobs.slice().sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        );

        target = candidates[0];
      }

      const response = await fetch(target.url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("فشل قراءة البيانات من Blob");
      }

      const data = await response.json();

      return res.status(200).json(data);
    }

    // POST: حفظ البيانات
    if (req.method === "POST") {
      const data = req.body;

      if (!data || typeof data !== "object") {
        return res.status(400).json({
          error: "البيانات غير صحيحة",
        });
      }

      await put(FILE_NAME, JSON.stringify(data), {
        access: "public",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
      });

      return res.status(200).json({
        success: true,
        message: "تم حفظ البيانات",
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });

  } catch (error) {
    console.error("Blob save error:", error);

    return res.status(500).json({
      error: error.message || "حدث خطأ في الحفظ",
    });
  }
}
