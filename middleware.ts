import { NextRequest, NextResponse } from "next/server";

// Root routing for the standalone harbor-index.org site.
//
// harbor-index.org's home page IS the blog, so on that host we serve
// /news/harbor-index at the root via a *rewrite* — the URL stays
// https://harbor-index.org with no /news/harbor-index suffix. Every other host
// (harbor-index.vercel.app, tbench.ai, previews) gets the same target as a
// normal redirect. This lives in middleware rather than next.config because
// Vercel's host-based `has`/`missing` matching on redirects proved unreliable.
const BLOG = "/blog/harbor-index";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const standalone =
    host === "harbor-index.org" || host.endsWith(".harbor-index.org");
  const url = req.nextUrl.clone();
  url.pathname = BLOG;
  return standalone ? NextResponse.rewrite(url) : NextResponse.redirect(url);
}

export const config = {
  // Only the root path; every other route (incl. all Explore sub-pages) is served
  // directly on both harbor-index.org and the other hosts.
  matcher: "/",
};
