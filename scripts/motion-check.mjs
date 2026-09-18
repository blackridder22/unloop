import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const ext = path.resolve(".output/chrome-mv3");
const ctx = await chromium.launchPersistentContext(
  await mkdtemp(path.join(tmpdir(), "unloop-motion-")),
  {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  },
);
try {
  const worker =
    ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
  const base = worker.url().split("/").slice(0, 3).join("/");
  const page = await ctx.newPage();
  await page.goto(base + "/options.html");
  await page.getByText("Changes save automatically.").waitFor();
  const toggle = page.getByRole("switch", { name: "Description", exact: true });
  await toggle.evaluate((el) => {
    window.motionSamples = [];
    el.addEventListener("click", () => {
      let n = 0;
      const sample = () => {
        window.motionSamples.push(
          getComputedStyle(el.firstElementChild).transform,
        );
        if (n++ < 18) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  });
  await toggle.click();
  await page.waitForTimeout(350);
  const samples = await page.evaluate(() => window.motionSamples);
  const middle = samples.some((t) => {
    const x = Number(t.split(",")[4]);
    return x > 0 && x < 16;
  });
  assert(middle, "Pointer toggle must contain intermediate positions");
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await toggle.focus();
  await toggle.press("Space");
  await page.getByText("Changes save automatically.").waitFor();
  assert.equal(await toggle.getAttribute("aria-checked"), "true");
  assert.equal(
    await toggle
      .locator("span")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
    "0s",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle.click();
  assert.equal(
    await toggle
      .locator("span")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
    "0s",
  );
  await page.getByText("Changes save automatically.").waitFor();
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await toggle.click();
  await page.getByText("Changes save automatically.").waitFor();
  await toggle.click({ force: true });
  await page.getByText("Changes save automatically.").waitFor();
  await page.waitForTimeout(200);
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  assert.equal(
    await toggle
      .locator("span")
      .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41),
    0,
  );
  console.log(
    "PASS pointer interpolation, immediate keyboard response, reduced motion, and interrupted reversal",
  );
} finally {
  await ctx.close();
}
