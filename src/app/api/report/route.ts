import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameTitle, category, message, userEmail } = body;

    if (!userEmail || !userEmail.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ Email của bạn khi báo cáo!" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY chưa được cấu hình trong .env" },
        { status: 500 }
      );
    }

    const resendPayload: Record<string, unknown> = {
      from: "GameHub Report <onboarding@resend.dev>",
      to: ["tranvangiaban+gamehub@gmail.com"],
      reply_to: userEmail,
      subject: `[GameHub Report] Báo cáo từ ${userEmail} (${gameTitle || "General"})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #0284c7; margin-bottom: 5px;">🎮 GameHub - Báo Cáo Lỗi / Góp Ý</h2>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          
          <p style="font-size: 15px;"><strong>📧 Email người báo cáo:</strong> <a href="mailto:${userEmail}" style="color: #0284c7; text-decoration: underline;">${userEmail}</a></p>
          <p style="font-size: 14px;"><strong>🎯 Game:</strong> ${gameTitle || "Chưa xác định"}</p>
          <p style="font-size: 14px;"><strong>🏷️ Phân loại:</strong> ${category || "Góp ý chung"}</p>

          <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin-top: 15px; border-radius: 4px;">
            <strong style="color: #0f172a; font-size: 14px;">📝 Nội dung báo cáo chi tiết:</strong><br />
            <p style="white-space: pre-wrap; margin-top: 8px; font-size: 14px; color: #334155;">${message || "Không có nội dung"}</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
          <p style="font-size: 12px; color: #94a3b8;">Hệ thống báo cáo tự động của GameHub.</p>
        </div>
      `,
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return NextResponse.json(
        { error: `Lỗi từ Resend API: ${errorText}` },
        { status: resendResponse.status }
      );
    }

    const data = await resendResponse.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
