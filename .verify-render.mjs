import { chromium } from "playwright";

const BASE = process.env.VBASE || "http://localhost:3000/harbor-index";
const targets = process.argv.slice(2).map((s) => { const i = s.indexOf("="); return { label: s.slice(0, i), path: s.slice(i + 1) }; });

const CODEISH = /(^|\n)\s*(def |class |import |from |function |const |let |var |public |private |static |#include|package |func |impl |fn |async |export )/;
const browser = await chromium.launch({ headless: true });
const results = [];
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message.slice(0, 100)));
  try {
    await page.goto(`${BASE}/${t.path}/`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector("ol li", { timeout: 20000 }).catch(() => {});
    const buttons = await page.$$("button");
    let clicked = 0;
    for (const b of buttons) {
      if (clicked >= 200) break;
      if ((await b.innerText().catch(() => "")).trim() === "Show") { await b.click().catch(() => {}); clicked++; }
    }
    await page.waitForTimeout(Math.min(6000, 2500 + clicked * 25));
    const m = await page.evaluate((CODEISH_SRC) => {
      const CODEISH = new RegExp(CODEISH_SRC);
      const blocks = [...document.querySelectorAll(".hi-code")];
      let codeBlocks = 0, highlighted = 0;
      const unhi = [];
      for (const bl of blocks) {
        const text = bl.textContent || "";
        if (text.length < 40 || !CODEISH.test(text)) continue;
        codeBlocks++;
        const colors = new Set();
        bl.querySelectorAll("span[style*=color]").forEach((s) => {
          const mm = (s.getAttribute("style") || "").match(/color:\s*([^;]+)/);
          if (mm) colors.add(mm[1].trim().toLowerCase());
        });
        if (colors.size >= 3) highlighted++;
        else unhi.push(text.replace(/\s+/g, " ").slice(0, 55));
      }
      const bodyText = document.body.innerText;
      return {
        codeBlocks, highlighted, unhiSamples: unhi.slice(0, 3),
        diffs: document.querySelectorAll(".annotate-diff").length,
        checklist: [...document.querySelectorAll("li span")].filter((e) => ["✓", "▶", "○"].includes(e.textContent?.trim())).length,
        mdRendered: [...document.querySelectorAll(".trajectory-markdown")].filter((e) => e.querySelector("strong,code,h1,h2,ul,ol,p")).length,
        rawSuccess: (bodyText.match(/\{"success":\s*\{/g) || []).length,
        rawMetadata: (bodyText.match(/\[metadata\] \{/g) || []).length,
        rawImage: (bodyText.match(/"type":\s*"image",\s*"source"/g) || []).length,
      };
    }, CODEISH.source);
    results.push({ label: t.label, clicked, ...m, consoleErrors: consoleErrors.slice(0, 2) });
  } catch (e) {
    results.push({ label: t.label, error: e.message.split("\n")[0] });
  }
  await page.close();
}
await browser.close();
let bad = 0;
for (const r of results) {
  if (r.error) { console.log(`❌ ${r.label}: ${r.error}`); bad++; continue; }
  const flags = [];
  const unhiCount = r.codeBlocks - r.highlighted;
  if (unhiCount > 0) flags.push(`UNHIGHLIGHTED ${unhiCount}/${r.codeBlocks}`);
  if (r.rawSuccess) flags.push(`RAW-SUCCESS×${r.rawSuccess}`);
  if (r.rawMetadata) flags.push(`RAW-META×${r.rawMetadata}`);
  if (r.rawImage) flags.push(`RAW-IMG×${r.rawImage}`);
  if (r.consoleErrors.length) flags.push(`CONSOLE:${JSON.stringify(r.consoleErrors)}`);
  if (flags.length) bad++;
  console.log(`${flags.length ? "⚠️ " : "✅ "}${r.label} (exp ${r.clicked}) code:${r.highlighted}/${r.codeBlocks} diffs:${r.diffs} checklist:${r.checklist} md:${r.mdRendered}`);
  if (flags.length) console.log(`     FLAGS: ${flags.join("  ")}${r.unhiSamples?.length ? "  e.g. " + JSON.stringify(r.unhiSamples[0]) : ""}`);
}
console.log(`\n${bad === 0 ? "✅ ALL CLEAN" : "⚠️  " + bad + " page(s) flagged"}`);
process.exit(bad === 0 ? 0 : 1);
