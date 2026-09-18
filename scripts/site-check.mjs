import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.SITE_URL || "http://127.0.0.1:5173/unloop/";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await mkdir("output/playwright", { recursive: true });
try {
  await p.goto(base);
  await p.getByRole("heading", { name: "You came for one video." }).waitFor();
  await p.evaluate(() => document.fonts.ready);
  for (const image of await p.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (img) => { await img.decode(); });
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  assert.equal(
    await p
      .locator("img")
      .evaluateAll((imgs) =>
        imgs.every((i) => i.complete && i.naturalWidth > 0),
      ),
    true,
  );
  await p.screenshot({
    path: "output/playwright/landing-desktop.png",
    fullPage: true,
  });
  const sw = p.getByRole("switch", { name: "Shorts", exact: true });
  await sw.click();
  assert.equal(await sw.getAttribute("aria-checked"), "true");
  await sw.focus();
  await sw.press("Space");
  assert.equal(await sw.getAttribute("aria-checked"), "false");
  await p.getByRole("button", { name: "Dark", exact: true }).click();
  assert.equal(
    await p
      .locator(".sample")
      .evaluate((e) => getComputedStyle(e).backgroundColor),
    "rgb(23, 23, 23)",
  );
  await p
    .getByText("Can I still visit my favorite creators?", { exact: true })
    .click();
  assert.equal(await p.locator("details").first().getAttribute("open"), "");
  for (const width of [390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (width === 390)
      await p.screenshot({
        path: "output/playwright/landing-mobile.png",
        fullPage: true,
      });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS landing images, switches, keyboard, theme, FAQ, 390/768/1440 layouts, no runtime errors",
  );
} finally {
  await b.close();
}
