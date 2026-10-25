import { expect, test } from "@playwright/test";

async function advance(page: import("@playwright/test").Page, answer: RegExp) {
  await page.getByRole("radio", { name: answer }).check();
  await page.getByRole("button", { name: /Lanjut|Lihat roadmap/ }).click();
}

for (const curriculum of ["2026", "2021"])
  test(`${curriculum}: full-screen quiz, graph, history, replacement, and sharing`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/roadmap");
    await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
    await advance(page, new RegExp(`Kurikulum ${curriculum}`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kamu mahasiswa IUP?");
    await page.getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(
      page.getByRole("radio", { name: new RegExp(`Kurikulum ${curriculum}`) }),
    ).toBeChecked();
    await page.getByRole("button", { name: "Lanjut", exact: true }).click();
    await advance(page, /Bukan, kelas reguler/);
    await expect(page.getByRole("radio")).toHaveCount(curriculum === "2026" ? 6 : 4);
    await advance(
      page,
      curriculum === "2026" ? /Analisis Data/ : /Rekayasa Perangkat Lunak dan Data/,
    );
    await advance(page, /Tidak mengambil Magang tambahan/);
    await expect(page.getByRole("heading", { name: "Roadmap kuliahmu" })).toBeVisible();
    await expect(page.locator(".react-flow__node-course")).not.toHaveCount(0);
    const graphCourseCount = await page.locator(".react-flow__node-course").count();
    await page.getByRole("button", { name: "7 semester", exact: true }).click();
    await expect(page.getByRole("button", { name: "7 semester", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.goBack();
    await expect(page.getByRole("button", { name: "8 semester", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(page.locator(".react-flow__node-course")).toHaveCount(graphCourseCount);
    const elective = page.locator(".roadmap-elective").first();
    await elective.locator("button").click();
    await page.getByRole("button", { name: "Ganti mata kuliah pilihan", exact: true }).click();
    await page.getByRole("combobox", { name: "Mata kuliah pengganti" }).click();
    await page.getByRole("option").first().click();
    await expect(page.getByText(/Prasyarat:/).last()).toBeVisible();
    await page.getByRole("button", { name: "Gunakan mata kuliah ini" }).click();
    await expect(page).toHaveURL(/ganti=/);
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    const shared = page.url();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Roadmap kuliahmu" })).toBeVisible();
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
    await page.getByRole("button", { name: "7 semester", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Tautan roadmap" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });

test("IUP follow-up, full-semester Magang, exposure controls, and invalid direct links", async ({
  page,
}) => {
  await page.goto("/roadmap");
  await advance(page, /Kurikulum 2026/);
  await advance(page, /Ya, kelas internasional/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Exposure apa yang kamu inginkan?",
  );
  await advance(page, /Magang internasional/);
  await advance(page, /Rekayasa Perangkat Lunak/);
  await advance(page, /Ya, ingin Magang/);
  await advance(page, /Satu semester penuh/);
  await expect(page.getByRole("heading", { name: "Roadmap kuliahmu" })).toBeVisible();
  await page
    .getByRole("group", { name: "Semester exposure", exact: true })
    .getByRole("button", { name: "Semester 7", exact: true })
    .click();
  await expect(page).toHaveURL(/semesterPaparan=7/);
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Semester exposure", exact: true })
      .getByRole("button", { name: "Semester 7", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "7 semester", exact: true }).click();
  await expect(page.getByText(/Bandingkan target 8 semester/)).toBeVisible();
  await page.goto(
    "/roadmap?kurikulum=2021&minat=Analisis%20Data&iup=tidak&magang=tidak&hasil=true",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bidang apa yang kamu minati?");
  await expect(page.getByRole("radio")).toHaveCount(4);
});
