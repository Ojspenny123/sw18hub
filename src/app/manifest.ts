import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SW18 Hub",
    short_name: "SW18 Hub",
    description: "Best places to eat and drink, local news and events in SW18.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fff94f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
