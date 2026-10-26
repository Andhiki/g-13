import { expect, test, type Page } from "@playwright/test";

async function advance(page: Page, answer: RegExp) {
  await page
    .getByRole("group", { name: "Pilihan jawaban" })
    .getByRole("button", { name: answer })
    .click();
  await page.getByRole("button", { name: /Lanjut|Lihat roadmap/ }).click();
}
async function openFilters(page: Page) {
  await expect(page.locator('[role="dialog"][data-state="closed"]')).toHaveCount(0);
  if (!(await page.getByRole("combobox", { name: "Target selesai", exact: true }).isVisible()))
    await page.getByRole("button", { name: "Buka filter roadmap", exact: true }).click();
}
async function closeFilters(page: Page) {
  await expect(page.getByRole("listbox")).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 1440) >= 1100)
    await page.getByRole("button", { name: "Tutup filter roadmap", exact: true }).click();
  else await page.getByRole("button", { name: "Tampilkan roadmap", exact: true }).click();
}
async function chooseTarget(page: Page, target: number) {
  await openFilters(page);
  await page.getByRole("combobox", { name: "Target selesai", exact: true }).click();
  await page.getByRole("option", { name: `${target} semester`, exact: true }).click();
  await closeFilters(page);
}

for (const curriculum of ["2026", "2021"])
  test(`${curriculum}: full-screen quiz, graph, history, replacement, and sharing`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/roadmap");
    await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.getByText("Ilmu Komputer UGM", { exact: true })).toHaveCount(0);
    await advance(page, new RegExp(`^${curriculum}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
    await page.getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(page.getByRole("button", { name: curriculum, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Lanjut", exact: true }).click();
    await advance(page, /^Reguler$/);
    await expect(
      page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button"),
    ).toHaveCount(curriculum === "2026" ? 6 : 4);
    await advance(
      page,
      curriculum === "2026" ? /Analisis Data/ : /Rekayasa Perangkat Lunak dan Data/,
    );
    await advance(page, /^Tidak$/);
    await expect(page.getByRole("region", { name: "Grafik roadmap kuliah" })).toBeVisible();
    await expect(
      page
        .locator(".react-flow__node-title")
        .getByRole("heading", { name: "Roadmap kuliah", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Target selesai", exact: true }),
    ).not.toBeVisible();
    const viewport = await page.locator(".react-flow").boundingBox();
    expect(viewport?.x).toBe(0);
    expect(viewport?.y).toBe(0);
    expect(viewport?.height).toBe(await page.evaluate(() => innerHeight));
    expect(viewport?.width).toBe(await page.evaluate(() => innerWidth));
    await expect(page.locator(".react-flow__node-course")).not.toHaveCount(0);
    const graphCourseCount = await page.locator(".react-flow__node-course").count();
    await chooseTarget(page, 7);
    await expect(page).toHaveURL(/lulus=7/);
    await page.goBack();
    await expect(page).toHaveURL(/lulus=8/);
    await page.reload();
    await expect(page.locator(".react-flow__node-course")).toHaveCount(graphCourseCount);
    const elective = page.locator(".roadmap-elective").first();
    const semester = curriculum === "2026" ? 4 : 3;
    await page.getByRole("button", { name: `Semester ${semester}`, exact: true }).click();
    await page.mouse.move(240, 650);
    await page.mouse.down();
    await page.mouse.move(240, 430, { steps: 5 });
    await page.mouse.up();
    await elective.locator("button").click();
    await expect(page.getByRole("heading", { name: "Roadmap kuliah", exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Ganti mata kuliah pilihan", exact: true }).click();
    await page.getByRole("combobox", { name: "Mata kuliah pengganti" }).click();
    await page.getByRole("option").first().click();
    await expect(page.getByText(/Prasyarat:/).last()).toBeVisible();
    await page.getByRole("button", { name: "Gunakan mata kuliah ini" }).click();
    await expect(page).toHaveURL(/ganti=/);
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await expect(page.locator(".react-flow__node-title")).toBeAttached();
    const shared = page.url();
    await page.reload();
    await expect(page.getByRole("region", { name: "Grafik roadmap kuliah" })).toBeVisible();
    await expect(page).toHaveURL(shared);
    await page.context().clearPermissions();
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("Clipboard unavailable")) },
      }),
    );
    await page.getByRole("button", { name: "Bagikan", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Tautan roadmap" })).toHaveValue(shared);
    await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
    await chooseTarget(page, 7);
    await expect(page.getByRole("textbox", { name: "Tautan roadmap" })).toHaveCount(0);
    await page.getByRole("button", { name: /^Catatan/ }).click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Asumsi dan sumber" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Tutup catatan roadmap", exact: true }).click();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

test("IUP follow-up, full-semester Magang, exposure controls, and invalid direct links", async ({
  page,
}) => {
  await page.goto("/roadmap");
  await advance(page, /^2026$/);
  await advance(page, /^IUP$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Exposure apa yang kamu inginkan?",
  );
  await advance(page, /Magang internasional/);
  await advance(page, /Rekayasa Perangkat Lunak/);
  await advance(page, /^Ya$/);
  await advance(page, /Satu semester penuh/);
  await expect(page.getByRole("region", { name: "Grafik roadmap kuliah" })).toBeVisible();
  await openFilters(page);
  await page.getByRole("combobox", { name: "Semester exposure", exact: true }).click();
  await page.getByRole("option", { name: "Semester 7", exact: true }).click();
  await expect(page).toHaveURL(/semesterPaparan=7/);
  await closeFilters(page);
  await page.reload();
  await openFilters(page);
  await expect(page.getByRole("combobox", { name: "Semester exposure", exact: true })).toHaveText(
    "Semester 7",
  );
  await closeFilters(page);
  await chooseTarget(page, 7);
  await page.getByRole("button", { name: /^Catatan/ }).click();
  await expect(page.getByText(/Bandingkan target 8 semester/)).toBeVisible();
  await page.goto(
    "/roadmap?kurikulum=2021&minat=Analisis%20Data&iup=tidak&magang=tidak&hasil=true",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bidang apa yang kamu minati?");
  await expect(
    page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button"),
  ).toHaveCount(4);
});

test("quiz entrances show the question before large label-only answers and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/roadmap");
  const choice = page.getByRole("button", { name: "2026", exact: true });
  await expect(choice).toHaveText("12026");
  await expect(
    page.getByText("Enam peminatan, wajib minat, dan Kerja Praktik.", { exact: true }),
  ).toHaveCount(0);
  await expect(choice.locator("..")).toHaveCSS("transform", "none");
  const box = await choice.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 1440) < 640 ? 96 : 128);
  await choice.click({ position: { x: box!.width - 12, y: box!.height - 12 } });
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  const stages = await page.evaluate(async () => {
    const samples: { question: number; answer: number }[] = [];
    for (let frame = 0; frame < 70; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const question = document.querySelector("#quiz-title")!.parentElement!;
      const answer = document.querySelector(
        '[aria-label="Pilihan jawaban"] button',
      )!.parentElement!;
      samples.push({
        question: Number(getComputedStyle(question).opacity),
        answer: Number(getComputedStyle(answer).opacity),
      });
    }
    return samples;
  });
  expect(stages.some((stage) => stage.question > 0.8 && stage.answer < 0.05)).toBe(true);
  expect(stages.at(-1)?.answer).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
  const reduced = await page
    .getByRole("group", { name: "Pilihan jawaban" })
    .getByRole("button")
    .first()
    .evaluate((button) => ({
      opacity: getComputedStyle(button.parentElement!).opacity,
      transform: getComputedStyle(button.parentElement!).transform,
    }));
  expect(reduced).toEqual({ opacity: "1", transform: "none" });
});

test("quiz keyboard choices, boundaries, conditional steps, and completion", async ({ page }) => {
  await page.goto("/roadmap");
  const title = page.getByRole("heading", { level: 1 });
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Kurikulum mana yang kamu ikuti?");
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "2026", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Kamu mahasiswa IUP?");
  await page.keyboard.press("1");
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Exposure apa yang kamu inginkan?");
  await page.keyboard.press("7");
  await expect(page.getByRole("button", { name: "Belum menentukan", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("2");
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Peminatan mana yang kamu pilih?");
  await page.keyboard.press("7");
  await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
  await page.keyboard.press("6");
  await expect(
    page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").nth(5),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Mau mengambil Magang?");
  await page.keyboard.press("2");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("region", { name: "Grafik roadmap kuliah" })).toBeVisible();
});

test("quiz layout, saved answers, shared links, and deliberate restart", async ({
  page,
  context,
}) => {
  await page.goto("/roadmap");
  await expect(page.getByText("Peta kurikulum", { exact: true })).toHaveCount(0);
  const answer = page.getByRole("button", { name: "2026", exact: true });
  await expect(answer).toBeVisible();
  const badge = answer.locator('[aria-hidden="true"]');
  const cardBox = await answer.boundingBox();
  const badgeBox = await badge.boundingBox();
  expect(badgeBox!.x - cardBox!.x).toBeLessThan(20);
  expect(badgeBox!.y - cardBox!.y).toBeLessThan(20);
  if ((page.viewportSize()?.width ?? 1440) < 640) {
    await expect(page.locator("main footer")).toHaveCSS("position", "fixed");
    const bar = await page.locator("main footer").boundingBox();
    expect(bar!.y + bar!.height).toBe(await page.evaluate(() => innerHeight));
  }
  await advance(page, /^2026$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
  const returning = await context.newPage();
  await returning.goto("/roadmap");
  await expect(returning.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
  await returning.close();
  await advance(page, /^Reguler$/);
  await advance(page, /Analisis Data/);
  await advance(page, /^Tidak$/);
  await chooseTarget(page, 7);
  const savedUrl = page.url();
  await page.goto("/roadmap");
  await expect(page.getByRole("region", { name: "Grafik roadmap kuliah" })).toBeVisible();
  await expect(page).toHaveURL(savedUrl);
  await expect(
    page.getByRole("button", { name: "Bagikan", exact: true }).locator("svg"),
  ).toHaveCount(1);
  await page.goto(
    "/roadmap?kurikulum=2021&minat=Lab%20Rekayasa%20Perangkat%20Lunak%20dan%20Data&iup=tidak&magang=tidak&hasil=true&lulus=8",
  );
  await expect(page).toHaveURL(/kurikulum=(?:%22)?2021/);
  await openFilters(page);
  await page.getByRole("button", { name: "Mulai lagi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
  await page.goto("/roadmap");
  await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("cs-courses:roadmap"))).toBeNull();
});

test("quiz works with invalid or unavailable storage", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cs-courses:roadmap", "broken json"));
  await page.goto("/roadmap");
  await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await advance(page, /^2026$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
});
