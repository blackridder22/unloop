import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "Unloop — YouTube, with a purpose",
    description:
      "Search, watch, and leave. Creator Videos, Live, and Playlists without Shorts or autoplay.",
    permissions: ["declarativeNetRequest", "storage"],
    host_permissions: [
      "*://*.youtube.com/*",
      "*://youtu.be/*",
      "*://*.youtube-nocookie.com/*",
    ],
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    action: {
      default_title: "Search with Unloop",
      default_icon: { 16: "icon/16.png", 32: "icon/32.png" },
    },
    declarative_net_request: {
      rule_resources: [{ id: "focus", enabled: true, path: "rules.json" }],
    },
    web_accessible_resources: [
      {
        resources: ["search.html", "options.html", "assets/*", "chunks/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
