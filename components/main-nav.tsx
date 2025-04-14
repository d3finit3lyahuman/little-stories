import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button, buttonVariants } from "./ui/button";
import { signOutAction } from "@/app/actions";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

// Optional: Define a type for the profile data we expect
interface UserProfile {
  username: string | null;
}

export async function MainNav() {
  const supabase = await createClient();
  const {
    data: { user }, // Get the authenticated user object (contains user.id)
  } = await supabase.auth.getUser();

  let userProfile: UserProfile | null = null;

  // If the user is logged in, fetch their profile from public.users
  if (user) {
    const { data, error } = await supabase
      .from("users") // Your public users table
      .select("username") // Select only the username
      .eq("user_id", user.id) // Match the user_id from auth
      .maybeSingle<UserProfile>(); // Expect a single result matching the interface

    if (error) {
      console.error("Error fetching user profile:", error.message);
      // Handle error appropriately - maybe log it, show a generic icon, etc.
      // For now, userProfile will remain null
    } else {
      userProfile = data;
    }
  }

  // Determine the profile link based on fetched data
  // Default to a generic profile page if username isn't found
  const profileHref =
    user && userProfile?.username ? `/profile/${userProfile.username}` : "/#"; // Fallback to /#

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "flex items-center justify-between px-6 py-3"
      )}
    >
      <Link href="/" className="text-xl font-bold tracking-tight">
        Little Stories
      </Link>

      <div className="flex items-center gap-x-3 sm:gap-x-4">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Home
        </Link>

        {user ? ( // Check if user is logged in (auth level)
          <>
            {/* Logged In Links */}
            <Link
              href="/stories/new-story"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Write a Story
            </Link>

            {/* --- DYNAMIC PROFILE LINK (using username) --- */}
            <Link
              // Use the determined profileHref
              href={profileHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-8 w-8"
              )}
              aria-label="User Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            {/* --- END DYNAMIC PROFILE LINK --- */}

            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Logged Out Links */}
            <Link
              href="/stories/new-story"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Write a Story
            </Link>
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
