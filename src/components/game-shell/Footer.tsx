import Link from "next/link";
import { Grid3x3, Shield, FileText, Code2, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 py-10 text-sm text-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-ink-950">
                <Grid3x3 size={16} strokeWidth={2.5} />
              </span>
              GameHub
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              Nền tảng game trí tuệ trực tuyến &amp; ngoại tuyến. Trải nghiệm mượt mà, không gián đoạn, hỗ trợ đa thiết bị.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted/80">
              <Code2 size={14} className="text-amber-400" />
              <span>Dự án Mã nguồn Mở (Open Source). Vui lòng giữ thông tin tác giả khi sử dụng mã nguồn.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="transition hover:text-foreground">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/#games" className="transition hover:text-foreground">
                  Thư viện Game
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="transition hover:text-foreground">
                  Bảng xếp hạng
                </Link>
              </li>
              <li>
                <Link href="/profile" className="transition hover:text-foreground">
                  Hồ sơ cá nhân
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Pháp lý &amp; Chính sách
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="flex items-center gap-1.5 transition hover:text-foreground">
                  <Shield size={13} className="text-amber-400" />
                  <span>Chính sách bảo mật</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-1.5 transition hover:text-foreground">
                  <FileText size={13} className="text-amber-400" />
                  <span>Điều khoản sử dụng</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-foreground"
                >
                  Giấy phép MIT (License)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} GameHub. Phát hành dưới giấy phép MIT License.</p>
          <p className="flex items-center gap-1">
            Xây dựng với <Heart size={12} className="text-coral-500 fill-coral-500 inline" /> bởi tác giả &amp; cộng đồng mã nguồn mở.
          </p>
        </div>
      </div>
    </footer>
  );
}
