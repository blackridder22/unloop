import { chromium } from "playwright";
import { readFile, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const browser = await chromium.launch({ headless: true });
const p = await browser.newPage();
await mkdir("public/icon", { recursive: true });
const svg = await readFile("public/logo.svg", "utf8");
for (const size of [16, 32, 48, 128]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(
    `<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
  );
  await p.screenshot({ path: `public/icon/${size}.png`, omitBackground: true });
}
await browser.close();
if (process.argv.includes("--capture")) {
  const ext = path.resolve(".output/chrome-mv3");
  const ctx = await chromium.launchPersistentContext(
    await mkdtemp(path.join(tmpdir(), "unloop-brand-")),
    {
      channel: "chromium",
      headless: true,
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
      viewport: { width: 1280, height: 800 },
    },
  );
  const worker =
    ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
  const base = worker.url().split("/").slice(0, 3).join("/");
  const page = await ctx.newPage();
  await page.goto(base + "/search.html");
  await page.getByRole("heading").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "site/public/search-preview.png" });
  await ctx.close();
}
