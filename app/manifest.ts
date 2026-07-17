import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Balot Arena",
    short_name: "Balot Arena",
    description: "تطبيق إدارة وحساب صكات البلوت والمنافسات والإحصائيات",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#021b13",
    theme_color: "#021b13",
    lang: "ar",
    dir: "rtl",
    categories: ["games", "sports", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
