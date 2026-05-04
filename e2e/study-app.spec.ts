import { expect, test } from "@playwright/test";

test("runs a simple CBT flow", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "네트워크관리사 2급 CBT" }),
  ).toBeVisible();
  await expect(page.getByText("내장 200문항")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("setup.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "시작" }).click();
  await expect(page.getByText("1/50")).toBeVisible();
  await page.getByRole("button", { name: /^1/ }).first().click();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("문제를 선택하지 않았습니다");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.getByRole("heading", { name: /합격권|조금 더/ })).toBeVisible();
  await expect(page.getByText("점수")).toBeVisible();
  await expect(page.getByText("전체 문항 풀이")).toBeVisible();
  await expect(page.getByRole("button", { name: "카카오톡 공유" })).toBeVisible();
  await expect(page.getByRole("button", { name: "링크 공유" })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("result.png"),
    fullPage: true,
  });
});

test("renders a shared CBT result page", async ({ page }) => {
  await page.goto("/share?score=60&correct=30&total=50&passed=1&subject=all");

  await expect(
    page.getByRole("heading", { name: "네트워크관리사 2급 CBT 결과" }),
  ).toBeVisible();
  await expect(page.getByText("60점")).toBeVisible();
  await expect(page.getByText("30/50", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "나도 풀기" })).toBeVisible();
});
