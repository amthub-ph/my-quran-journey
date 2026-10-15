import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { hasEnvVars } from "../utils";

export async function updateSession(
  request: NextRequest,
) {
  const pathname = request.nextUrl.pathname;

  if (
    [
      "/api/reminders/send", // Authenticated by CRON_SECRET in its route.
      "/robots.txt",
      "/sitemap.xml",
      "/sw.js",
      "/manifest.webmanifest",
      "/offline.html",
    ].includes(pathname) ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) =>
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              ),
          );
        },
      },
    },
  );

  const { data } =
    await supabase.auth.getClaims();

  const user = data?.claims;

  const isPublicPage =
    pathname === "/" ||
    pathname === "/start" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/quran");

  const isPublicQuranApi =
    pathname.startsWith(
      "/api/quran/chapter/",
    ) ||
    pathname.startsWith(
      "/api/recitation/",
    );

  if (
    !user &&
    !isPublicPage &&
    !isPublicQuranApi
  ) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        {
          error: "Please sign in again.",
        },
        {
          status: 401,
        },
      );

      supabaseResponse.cookies
        .getAll()
        .forEach((cookie) =>
          response.cookies.set(cookie),
        );

      return response;
    }

    const url = request.nextUrl.clone();

    url.pathname = "/auth/login";

    const response =
      NextResponse.redirect(url);

    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) =>
        response.cookies.set(cookie),
      );

    return response;
  }

  return supabaseResponse;
}