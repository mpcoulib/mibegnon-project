import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mibegnon — Bourses et universités",
    short_name: "Mibegnon",
    description:
      "Trouve des bourses et des universités dans le monde entier. Gratuit pour tous les élèves de Côte d'Ivoire.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1B1D42",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
