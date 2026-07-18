import { createClient } from "@/lib/supabase/client";
import { generateGuestName } from "./guestNames";
import { PlayerIdentity } from "./types";

const GUEST_ID_KEY = "gamehub:guestId";
const GUEST_NAME_KEY = "gamehub:guestName";

function generateGuestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback cực hiếm (trình duyệt rất cũ không có crypto.randomUUID).
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Lấy (hoặc tạo mới nếu chưa có) id + tên của người chơi khách, lưu ổn định trong localStorage. */
export function getOrCreateGuestIdentity(): { guestId: string; guestName: string } {
  if (typeof window === "undefined") {
    // Gọi trên server (không nên xảy ra với tính năng này, nhưng phòng hờ).
    return { guestId: "guest-server", guestName: "Khách" };
  }

  let guestId = window.localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  let guestName = window.localStorage.getItem(GUEST_NAME_KEY);
  if (!guestName) {
    guestName = generateGuestName();
    window.localStorage.setItem(GUEST_NAME_KEY, guestName);
  }

  return { guestId, guestName };
}

export function setGuestName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 40);
  if (trimmed.length === 0) return;
  window.localStorage.setItem(GUEST_NAME_KEY, trimmed);
}

/**
 * Trả về identity của người chơi hiện tại: ưu tiên user đã đăng nhập
 * (dùng username từ bảng `profiles`), rơi về guest identity nếu chưa
 * đăng nhập hoặc Supabase chưa được cấu hình.
 */
export async function getCurrentIdentity(): Promise<PlayerIdentity> {
  const supabase = createClient();
  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .maybeSingle();
      const displayName = profile?.username || userData.user.email?.split("@")[0] || "Người chơi";
      return { id: userData.user.id, isGuest: false, displayName };
    }
  }

  const { guestId, guestName } = getOrCreateGuestIdentity();
  return { id: guestId, isGuest: true, displayName: guestName };
}
