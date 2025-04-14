import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: { session }, error } = await supabase.auth.getSession(); // Use getSession for clarity

    // Redirect unauthenticated users trying to access protected routes
    if (error || !session) { // If error getting session OR no session exists
        if (request.nextUrl.pathname.startsWith("/protected")) {
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        // Add other protected routes here if needed
        // e.g., if (request.nextUrl.pathname.startsWith("/profile")) { ... }
    }



    // Refresh the session cookie if needed
    return response;

  } catch (e) {
    console.error("Middleware Error:", e); // Log the actual error
    // Fallback response
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

// Ensure you have a matcher config in middleware.ts if needed
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * Feel free to modify this pattern to include more paths.
//      */
//     '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }

