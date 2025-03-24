import Link from "next/link";
import { buttonVariants } from "./ui/button";

export function MainNav() {
  return (
    <nav className="flex justify-between items-center py-4 mb-8">
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
        <Link href="/" className={buttonVariants({ variant : "default" })}>
          Login
        </Link>
      </div>
    </nav>
  );
}
