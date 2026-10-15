import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Qur'an Journey",
    short_name: "Qur'an Journey",
    description:
      "Read the Qur'an, listen to recitation, track progress, save reflections, bookmarks, goals, and reminders.",

    start_url: "/",
    display: "standalone",

    background_color: "#FAF9F5",
    theme_color: "#315C4B",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}