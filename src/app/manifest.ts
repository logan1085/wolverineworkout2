import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wolverine — Personal health",
    short_name: "Wolverine",
    description: "Your daily health, personal agent, and memory in one place.",
    start_url: "/?tab=Today",
    scope: "/",
    display: "standalone",
    background_color: "#111b17",
    theme_color: "#111b17",
    icons: [
      {
        src: "/wolverine-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
