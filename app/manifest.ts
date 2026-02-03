import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEIIKI Survey PWA - Offline First",
    short_name: "SEIIKI Survey",
    description: "PT. SOLUSI ENERGI KELISTRIKAN INDONESIA - Survey Portal dengan mode offline lengkap",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFFFF",
    theme_color: "#1f2937",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "business", "utilities"],
    shortcuts: [
      {
        name: "Dashboard Survey",
        short_name: "Dashboard",
        description: "Kelola data survey dan statistik",
        url: "/survey/dashboard",
        icons: [{ "src": "/icon-192x192.png", "sizes": "192x192" }]
      },
      {
        name: "Upload Foto",
        short_name: "Upload",
        description: "Upload foto survey",
        url: "/survey/upload",
        icons: [{ "src": "/icon-192x192.png", "sizes": "192x192" }]
      },
      {
        name: "Galeri",
        short_name: "Galeri",
        description: "Lihat foto-foto survey",
        url: "/survey/gallery",
        icons: [{ "src": "/icon-192x192.png", "sizes": "192x192" }]
      }
    ],
    prefer_related_applications: false,
    lang: "id-ID",
    dir: "ltr"
  }
}
