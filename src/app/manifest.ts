import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GameHub — Game trí tuệ",
    short_name: "GameHub",
    description: "Chơi Sudoku và các game giải đố nhỏ gọn, hoạt động cả khi offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0d16",
    theme_color: "#0b0d16",
    orientation: "portrait-primary",
    categories: ["games", "puzzle", "entertainment"],
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
