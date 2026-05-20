import { expect, test } from "@playwright/test";

test("edits a road style and downloads MLN and LSP", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Road MLN Generator" })
  ).toBeVisible();
  await expect(page.getByLabel("Road half-width")).toHaveValue("3.5");
  await expect(page.getByLabel("Sidewalk width")).toHaveValue("2");

  await page.getByLabel("Road half-width").fill("4");
  await page.getByLabel("Sidewalk width").fill("1.5");

  await expect(page.getByLabel("Road cross-section preview")).toContainText(
    "Road Edge: 4"
  );
  await expect(page.getByLabel("Road cross-section preview")).toContainText(
    "Sidewalk Outer Edge: 5.5"
  );

  await page.getByLabel("Future layer prefix").fill("C");
  const sidewalkLayerCells = page.locator(".layer-preview", {
    hasText: "C-Sidewalk Outer Edge",
  });
  await expect(sidewalkLayerCells).toHaveCount(2);

  const mlnDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download MLN" }).click();
  const mlnFile = await mlnDownload;

  expect(mlnFile.suggestedFilename()).toBe("ROAD_SIMPLE_URBAN.mln");

  const lspDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download LSP" }).click();
  const lspFile = await lspDownload;

  expect(lspFile.suggestedFilename()).toBe("ROAD_SIMPLE_URBAN.lsp");
});
