import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  // Message display remains the same, but centered better
  if ("message" in searchParams) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    // Centering container
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {" "}
        {/* Control width */}
        <CardHeader className="text-center">
          {" "}
          {/* Center header text */}
          <CardTitle className="text-2xl">Create your Account</CardTitle>
          <CardDescription>
            Already have an account?{" "}
            <Button variant="link" className="p-0" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </CardDescription>
        </CardHeader>
        {/* Pass server action directly to form */}
        <form action={signUpAction}>
          <CardContent className="space-y-4">
            {" "}
            <div className="space-y-1.5">
              {" "}
              {/* Group label and input */}
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="avidreader@365"
                required
              />
              

            </div>
            {/* Add spacing between form elements */}
            <div className="space-y-1.5">
              {" "}
              {/* Group label and input */}
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email" // validate email format
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {/* --- Role Selection --- */}
            <div className="space-y-3 rounded-md border p-4">
              {" "}
              {/* Group checkboxes visually */}
              <Label className="text-base">I want to be a...</Label>
              <div className="flex items-start space-x-3">
                <Checkbox id="is_author" name="is_author" />{" "}
                {/* Name matches expected form data */}
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="is_author"
                    className="cursor-pointer font-medium"
                  >
                    Story Author
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Create and share your own stories.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox id="is_reader" name="is_reader" />{" "}
                {/* Name matches expected form data */}
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="is_reader"
                    className="cursor-pointer font-medium"
                  >
                    Reader
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Discover and enjoy stories from others.
                  </p>
                </div>
              </div>
              {/* Add validation message area if needed, though simple checkboxes might not require complex validation */}
            </div>
            {/* --- End Role Selection --- */}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {" "}
            {/* Footer for button and messages */}
            <SubmitButton
              className="w-full"
              pendingText="Creating Account..."
            >
              Sign up
            </SubmitButton>
            <FormMessage message={searchParams} /> {/* Display form messages */}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
