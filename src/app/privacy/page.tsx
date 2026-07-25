import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { ShieldCheck, Lock, Database, Eye, UserCheck, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách bảo mật (Privacy Policy)",
  description: "Chính sách bảo mật của GameHub — Cam kết bảo vệ thông tin cá nhân và dữ liệu riêng tư của người chơi.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative border-b border-border bg-surface/30 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex items-center gap-3 text-amber-400 font-medium text-sm mb-2">
              <ShieldCheck size={20} />
              <span>Bảo vệ quyền riêng tư người dùng</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Chính sách bảo mật (Privacy Policy)
            </h1>
            <p className="mt-3 text-base text-muted max-w-2xl">
              Cập nhật lần cuối: 25/07/2026. GameHub cam kết tôn trọng và bảo vệ tối đa quyền riêng tư của bạn khi trải nghiệm dịch vụ của chúng tôi.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10 text-foreground">
          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <Database className="text-amber-400" size={20} />
              <h2>1. Thu thập dữ liệu &amp; Lưu trữ</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              GameHub hoạt động theo tiêu chí ưu tiên trải nghiệm cá nhân và tối giản thu thập dữ liệu:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
              <li>
                <strong className="text-foreground">Chế độ chơi Khách (Guest Mode):</strong> Bạn không cần đăng ký hay cung cấp bất kỳ thông tin cá nhân nào để chơi game. Dữ liệu lịch sử chơi, điểm số và trạng thái game được lưu trữ trực tiếp và an toàn trong trình duyệt của bạn (sử dụng IndexedDB &amp; LocalStorage).
              </li>
              <li>
                <strong className="text-foreground">Tài khoản đăng nhập (Tùy chọn):</strong> Nếu bạn chọn đăng nhập qua Supabase Auth, chúng tôi lưu giữ thông tin tài khoản cơ bản (như email, tên hiển thị, avatar) để đồng bộ bảng xếp hạng (Leaderboard) và tiến trình giữa các thiết bị.
              </li>
              <li>
                <strong className="text-foreground">Chơi Online Multiplayer:</strong> Dữ liệu phòng chơi, trạng thái nước đi và tin nhắn chat trong phòng online chỉ phục vụ cho ván đấu realtime và không được chia sẻ cho bên thứ ba.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <Lock className="text-teal-400" size={20} />
              <h2>2. Mục đích sử dụng thông tin</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Mọi thông tin được thu thập (nếu có) chỉ được sử dụng cho các mục đích sau:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
              <li>Duy trì và vận hành các tính năng của GameHub (chơi offline, kết nối phòng online, lưu kỷ lục).</li>
              <li>Hiển thị bảng xếp hạng thành tích người chơi.</li>
              <li>Cải thiện trải nghiệm giao diện và hiệu năng ứng dụng.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <Eye className="text-coral-500" size={20} />
              <h2>3. Dịch vụ bên thứ ba &amp; Quảng cáo</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Để duy trì máy chủ và phát triển dự án mã nguồn mở miễn phí:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
              <li>Chúng tôi có thể tích hợp dịch vụ hiển thị quảng cáo từ các đối tác đáng tin cậy. Các đối tác này có thể sử dụng cookie hoặc công nghệ theo dõi tiêu chuẩn ngành để hiển thị quảng cáo phù hợp.</li>
              <li>Chúng tôi không bao giờ bán, trao đổi hoặc thương mại hóa thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <UserCheck className="text-amber-400" size={20} />
              <h2>4. Quyền riêng tư của bạn</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Bạn luôn có toàn quyền kiểm soát dữ liệu cá nhân của mình:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
              <li>Có thể xóa toàn bộ dữ liệu game lưu trữ cục bộ bằng cách xóa bộ nhớ cache / LocalStorage của trình duyệt.</li>
              <li>Có thể đăng xuất tài khoản hoặc yêu cầu hỗ trợ xóa tài khoản bất cứ lúc nào.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <HelpCircle className="text-amber-400" size={20} />
              <h2>5. Liên hệ &amp; Thắc mắc</h2>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Nếu bạn có bất kỳ câu hỏi nào liên quan đến Chính sách bảo mật hoặc quyền riêng tư tại GameHub, vui lòng liên hệ thông qua trang GitHub repository của dự án hoặc xem chi tiết tại {" "}
              <Link href="/terms" className="text-amber-400 underline underline-offset-4 hover:text-amber-300">
                Điều khoản sử dụng
              </Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
