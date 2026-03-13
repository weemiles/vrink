import { chromium } from "playwright";

const baseUrl = process.env.BRAND_AGENT_URL || "http://127.0.0.1:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    await page.getByRole("heading", { name: "Upload your Figma and Pencil images now" }).waitFor();
    await page.getByRole("button", { name: "Find logo" }).first().click();
    await page.getByRole("button", { name: "Generate banner" }).first().click();

    await page.getByPlaceholder("Ask for a logo, request a missing asset, or generate a banner preview...").fill(
      "Generate banner for launch week",
    );
    await page.getByRole("button", { name: "Send" }).click();
    await page.locator('button:has-text("Download SVG"):visible').waitFor();

    console.log("Smoke check passed:", baseUrl);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
