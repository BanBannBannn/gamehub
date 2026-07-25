import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { FileText, Code2, AlertTriangle, Users, Scale, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng (Terms of Service)",
  description: "Điều khoản sử dụng dự án GameHub — Quy định về trải nghiệm ứng dụng, bản quyền mã nguồn mở và giữ thông tin tác giả.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative border-b border-border bg-surface/30 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex items-center gap-3 text-amber-400 font-medium text-sm mb-2">
              <FileText size={20} />
              <span>Quy định &amp; Bản quyền pháp lý</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Điều khoản sử dụng (Terms of Service)
            </h1>
            <p className="mt-3 text-base text-muted max-w-2xl">
              Cập nhật lần cuối: 25/07/2026. Vui lòng đọc kỹ các điều khoản dưới đây trước khi bắt đầu trải nghiệm dịch vụ hoặc sử dụng mã nguồn của GameHub.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10 text-foreground">
          {/* Open Source & Author Attribution Section - HIGHLIGHTED */}
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-display text-xl font-bold">
              <Code2 size={24} />
              <h2>1. Quy định về Mã nguồn Mở &amp; Tác quyền (Author Attribution)</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              GameHub là một sản phẩm <strong>Mã nguồn Mở (Open Source Project)</strong> được phát hành dưới giấy phép <strong>MIT License</strong>. Chúng tôi hoan nghênh cộng đồng tham khảo, học tập và đóng góp phát triển.
            </p>
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={16} />
                BẮT BUỘC KHI TÁI SỬ DỤNG / FORK MÃ NGUỒN:
              </h3>
              <ul className="list-disc pl-5 text-xs text-muted space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-foreground">Giữ lại thông tin tác giả ban đầu:</strong> Khi bạn lấy, sao chép, chỉnh sửa hoặc fork mã nguồn này (dù là toàn bộ hay một phần), bạn <strong>phải giữ nguyên ghi chú bản quyền (Copyright Notice) và tên tác giả gốc</strong> trong mã nguồn cũng như tài liệu dự án.
                </li>
                <li>
                  <strong className="text-foreground">Đính kèm Giấy phép MIT:</strong> Mọi bản sao hoặc phần phát sinh của phần mềm phải đi kèm với file LICENSE gốc hoặc nội dung giấy phép MIT tương ứng.
                </li>
                <li>
                  <strong className="text-foreground">Dẫn nguồn gốc:</strong> Khuyên dùng việc đính kèm liên kết trỏ về repository gốc của tác giả trên các sản phẩm công khai hoặc fork công khai.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Chấp nhận điều khoản */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <Scale className="text-teal-400" size={20} />
              <h2>2. Chấp nhận điều khoản</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Bằng việc truy cập ứng dụng GameHub trên trình duyệt web, cài đặt PWA hoặc sử dụng bất kỳ tính năng nào của dự án, bạn đồng ý tuân thủ toàn bộ các quy định được mô tả trong Điều khoản này và {" "}
              <Link href="/privacy" className="text-amber-400 underline underline-offset-4 hover:text-amber-300">
                Chính sách bảo mật
              </Link>.
            </p>
          </div>

          {/* Section 3: Quy tắc cộng đồng & Chơi Online */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <Users className="text-coral-500" size={20} />
              <h2>3. Quy tắc khi Chơi Online &amp; Giao lưu</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Khi tham gia các phòng chơi nhiều người (Multiplayer) hoặc sử dụng tính năng nhắn tin chat:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
              <li>Không gian lận, gian lận phần mềm (bot/hack) hoặc lợi dụng lỗi game gây ảnh hưởng tiêu cực đến người chơi khác.</li>
              <li>Không sử dụng ngôn từ xúc phạm, đe dọa, phân biệt đối xử hoặc vi phạm thuần phong mỹ tục trong khung chat.</li>
              <li>Chúng tôi có quyền tạm ngắt kết nối hoặc hạn chế quyền truy cập của các tài khoản/thiết bị vi phạm nghiêm trọng quy tắc cộng đồng.</li>
            </ul>
          </div>

          {/* Section 4: Miễn trừ trách nhiệm */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <AlertTriangle className="text-amber-400" size={20} />
              <h2>4. Miễn trừ trách nhiệm (Disclaimer)</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              GameHub được cung cấp theo nguyên tắc <em>&quot;nguyên trạng&quot; (AS IS)</em> và <em>&quot;sẵn có&quot;</em>. Chúng tôi nỗ lực tối đa để ứng dụng hoạt động ổn định và an toàn, tuy nhiên không bảo đảm tuyệt đối rằng dịch vụ sẽ không bao giờ gián đoạn hoặc hoàn toàn không có lỗi phát sinh.
            </p>
          </div>

          {/* Section 5: Giấy phép & Thông tin thêm */}
          <div className="space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-bold text-foreground">Liên kết &amp; Tham khảo thêm</h2>
            <div className="flex flex-wrap gap-4 text-xs">
              <Link href="/privacy" className="flex items-center gap-1 text-amber-400 hover:underline">
                <span>Chính sách bảo mật (Privacy Policy)</span>
                <ExternalLink size={12} />
              </Link>
              <Link href="/" className="flex items-center gap-1 text-amber-400 hover:underline">
                <span>Trở về Trang chủ GameHub</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
