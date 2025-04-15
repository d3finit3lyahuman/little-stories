import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button, buttonVariants } from "./ui/button";
import { signOutAction } from "@/app/actions";
import { BookOpen, Home, PenTool, User, Stamp } from "lucide-react"; // Added more icons
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { ThemeToggle } from "./theme-toggle";

// Optional: Define a type for the profile data we expect
interface UserProfile {
  username: string | null;
}

// Loading fallback for the navigation
function NavSkeleton() {
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "flex items-center justify-between px-6 py-3"
      )}
    >
      <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
      <div className="flex items-center gap-x-3">
        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
      </div>
    </nav>
  );
}

export async function MainNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile: UserProfile | null = null;

  // If the user is logged in, fetch their profile from public.users
  if (user) {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle<UserProfile>();

    if (!error) {
      userProfile = data;
    } else {
      console.error("Error fetching user profile:", error.message);
    }
  }

  // Determine the profile link based on fetched data
  const profileHref =
    user && userProfile?.username
      ? `/profile/${userProfile.username}`
      : "/profile"; // Fallback to a generic profile page

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "flex items-center justify-between px-6 py-3",
        "transition-all duration-200"
      )}
    >
      <Link
        href="/"
        className="text-xl font-bold tracking-tight flex items-center gap-2"
      >
        <BookOpen className="h-5 w-5" />
        <span>Little Stories</span>
      </Link>

      <div className="flex items-center gap-x-3 sm:gap-x-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "flex items-center gap-1"
          )}
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {user ? (
          <>
            <Link
              href="/stories/new-story"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Write</span>
            </Link>

            <Link
              href="/stories/claim-story"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <Stamp className="h-4 w-4" />
              <span className="hidden sm:inline">Claim Story</span>
            </Link>

            <Link
              href={profileHref}
              className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 relative"
              )}
              aria-label="User Profile"
            >
              <User className="h-4 w-4" />
            </Link>

            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/stories/new-story"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Write</span>
            </Link>
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Sign In
            </Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}

// Wrap with Suspense for better loading experience
export default function MainNavWithSuspense() {
  return (
    <Suspense fallback={<NavSkeleton />}>
      <MainNav />
    </Suspense>
  );
}
