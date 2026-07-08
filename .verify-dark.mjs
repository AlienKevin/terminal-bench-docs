import { chromium } from "playwright";

const BASE = process.env.VBASE || "http://localhost:3000/harbor-index";
const targets = process.argv.slice(2).map((s) => { const i = s.indexOf("="); return { label: s.slice(0, i), path: s.slice(i + 1) }; });
const THRESH = 2.2; // contrast ratio below this = illegible

const browser = await chromium.launch({ headless: true });
const results = [];
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 80)));
  await page.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch (e) {} });
  try {
    await page.goto(`${BASE}/${t.path}/`, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForSelector("ol li", { timeout: 20000 }).catch(() => {});
    const btns = await page.$$("button");
    let c = 0;
    for (const b of btns) { if (c >= 120) break; if ((await b.innerText().catch(() => "")).trim() === "Show") { await b.click().catch(() => {}); c++; } }
    await page.waitForTimeout(Math.min(6500, 2800 + c * 25));
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(300);
    const m = await page.evaluate((THRESH) => {
      // Resolve ANY css color (rgb/oklch/lab/color()) to rgba via canvas.
      const cv = document.createElement("canvas"); cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      const toRgb = (str) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillStyle = str; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3]]; };
      const relLum = (r, g, b) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgRgb = (el) => {
        // Collect the stack of (semi-)opaque bg layers, then composite them.
        const stack = [];
        let e = el;
        while (e) {
          const [r, g, b, a] = toRgb(getComputedStyle(e).backgroundColor);
          if (a > 0) { stack.push([r, g, b, a / 255]); if (a >= 255) break; }
          e = e.parentElement;
        }
        let base = [13, 13, 13];
        for (let i = stack.length - 1; i >= 0; i--) {
          const [r, g, b, al] = stack[i];
          base = [r * al + base[0] * (1 - al), g * al + base[1] * (1 - al), b * al + base[2] * (1 - al)];
        }
        return base;
      };
      const contrast = (el) => {
        const [r, g, b, a] = toRgb(getComputedStyle(el).color);
        if (a === 0) return null;
        const [br, bg2, bb] = bgRgb(el);
        const L1 = relLum(r, g, b), L2 = relLum(br, bg2, bb);
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      };
      const kinds = {
        code: ".hi-code .shiki span",
        diff: ".annotate-diff .diff-code, .annotate-diff .diff-code-insert, .annotate-diff .diff-code-delete",
        terminalPre: ".rounded pre:not(.shiki)",
        checklistTxt: "ol li > span:last-child, ul li > span:last-child",
        mdText: ".trajectory-markdown p, .trajectory-markdown li, .trajectory-markdown code, .trajectory-markdown strong",
        headline: "p.font-mono",
        label: "div.uppercase",
      };
      const out = {};
      for (const [k, sel] of Object.entries(kinds)) {
        let els = [];
        try { els = [...document.querySelectorAll(sel)]; } catch (e) {}
        els = els.filter((e) => (e.textContent || "").trim().length > 0 && e.offsetParent !== null);
        let low = 0, minc = 99, worst = null, n = 0;
        for (const e of els.slice(0, 300)) {
          const cc = contrast(e);
          if (cc == null) continue;
          n++;
          if (cc < minc) minc = cc;
          if (cc < THRESH) { low++; if (!worst) worst = (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34); }
        }
        out[k] = { n, low, minc: n ? +minc.toFixed(2) : null, worst };
      }
      out._bodyBg = getComputedStyle(document.body).backgroundColor;
      return out;
    }, THRESH);
    results.push({ label: t.label, clicked: c, m, errs: errs.slice(0, 2) });
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
  for (const [k, v] of Object.entries(r.m)) {
    if (k[0] === "_") continue;
    if (v.low > 0) flags.push(`${k} ${v.low}/${v.n} (min ${v.minc}) "${v.worst}"`);
  }
  if (r.errs.length) flags.push("ERR:" + r.errs[0]);
  if (flags.length) bad++;
  console.log(`${flags.length ? "⚠️ " : "✅ "}${r.label} (exp ${r.clicked})`);
  for (const f of flags) console.log(`     ${f}`);
}
console.log(`\n${bad === 0 ? "✅ DARK MODE ALL LEGIBLE" : "⚠️  " + bad + " page(s) low-contrast"}`);
process.exit(bad === 0 ? 0 : 1);
