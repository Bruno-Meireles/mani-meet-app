import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";

const PAGES = ["/", "/agendar", "/sobre", "/meus-agendamentos", "/privacidade"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = PAGES.map(
          (p) => `  <url><loc>${siteConfig.url}${p === "/" ? "" : p}</loc></url>`,
        );
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
