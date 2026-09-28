import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// easyallen.uzsaeed.com serves the static app in public/easyallen from the root,
// while uzsaeed.com/easyallen keeps working through the rewrite in next.config.
const EASYALLEN_HOSTS = ["easyallen.uzsaeed.com", "easyallen.localhost"];

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  if (!EASYALLEN_HOSTS.includes(host)) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (url.pathname === "/" || url.pathname === "") url.pathname = "/easyallen/index.html";
  else if (!url.pathname.startsWith("/easyallen")) url.pathname = `/easyallen${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next's own asset routes; everything else may belong to EasyAllen.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
