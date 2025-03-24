import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { SubmitButton } from "./submit-button";
import { signOutAction } from "@/app/actions";

export function MainNav() {
  return (
    <nav className="flex justify-between items-center py-4 px-6">
      <Link href="/" className="text-2xl font-bold">
        Little Stories
      </Link>
      <div>
        <Link href="/" className="mr-4">
          Home
        </Link>
        <Link href="/about" className="mr-4">
          About
        </Link>
        <Link href="/stories/new-story" className="mr-4">
            Write a Story
          </Link>
        <Link href="/sign-in" className={buttonVariants({ variant : "default" })}>
          Login
        </Link>
      </div>
    </nav>
  );
}
