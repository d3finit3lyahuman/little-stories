import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server"; 


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url); // Keep using URL object
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  // Get the 'next' parameter used by password reset and potentially others
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code); // Check for errors

    if (error) {
      console.error("Auth Callback Error (Code Exchange):", error.message);
      // Redirect to an error page or sign-in on failure
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
    }
  } else {
      // Handle cases where no code is present (e.g., direct access)
      console.warn("Auth Callback accessed without code.");
      return NextResponse.redirect(`${origin}/sign-in?error=invalid_callback`);
  }

  // Check if 'next' is provided and is a valid path
  if (next && next.startsWith('/')) {
    console.log(`Redirecting to 'next' path: ${next}`);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // If 'next' is not provided, redirect to a fallback URL
  console.log("No 'next' param, redirecting to fallback: /");
  return NextResponse.redirect(`${origin}/`); // Redirect to home page as a safer default
}
