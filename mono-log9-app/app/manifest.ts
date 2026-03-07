import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/appMeta";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    icons: [
      { src: "/icons/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable_icon_x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable_icon_x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
