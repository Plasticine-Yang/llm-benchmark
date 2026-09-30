import { test, expect } from "@playwright/test";

test("reservation validates, submits and restores keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "预约试听", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "亲耳听见，不同。" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "确认预约" }).click();
  await expect(page.getByText("请填写你的称呼")).toBeVisible();
  await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
  await expect(page.getByLabel("你的称呼")).toBeFocused();
  await page.getByLabel("你的称呼").fill("林");
  await page.getByLabel("电子邮箱").fill("listener@example.com");
  await page.getByLabel("试听城市").selectOption("上海");
  await dialog.getByRole("button", { name: "确认预约" }).click();
  await expect(
    dialog.getByRole("button", { name: "正在登记…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "为你，留一个位置。" }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nocturne-reservation")!),
  );
  expect(saved.email).toBe("listener@example.com");
  expect(saved.city).toBe("上海");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("finishes, structure and story are interactive", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "观看 90 秒设计故事" }).click();
  const story = page.getByRole("dialog", { name: "从安静开始。" });
  await expect(story).toBeVisible();
  await story.getByRole("button", { name: "暂停故事" }).click();
  await expect(story.getByRole("button", { name: "播放故事" })).toBeVisible();
  await page.getByRole("slider", { name: "设计故事播放进度" }).fill("45");
  await expect(
    page.getByRole("heading", { name: "让内部，成为外观。" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Burnt Amber 灼琥珀" }).click();
  await expect(
    page.getByRole("button", { name: "Burnt Amber 灼琥珀" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".site")).toHaveClass(/color-amber/);
  await page.getByRole("button", { name: "预约购买" }).click();
  await expect(page.getByText("Burnt Amber / ¥3,499")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "细节，不必大声。" }).click();
  await expect(page.locator(".structure-installation svg")).toHaveClass(
    /exploded-2/,
  );
  await page.getByRole("button", { name: "右侧", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "右侧", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("mobile navigation and sound controls work with a keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "打开导航菜单" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Sound", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Sound", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "打开导航菜单" }),
  ).toHaveAttribute("aria-expanded", "false");
  const audio = page.getByRole("button", { name: /聆听声场演示/ });
  await audio.click();
  await expect(
    page.getByRole("button", { name: /暂停声场试听/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /暂停声场试听/ }).click();
  await expect(audio).toHaveAttribute("aria-pressed", "false");
});

for (const width of [320, 375, 768, 1440]) {
  test(`layout fits ${width}px and honors reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /听见空间/ })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".levitating-product")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    await page.screenshot({
      path: `/tmp/nocturne-${width}.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `/tmp/nocturne-hero-${width}.png` });
    expect(errors).toEqual([]);
  });
}
