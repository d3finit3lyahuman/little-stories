import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Shadcn Card
import { cn } from "@/lib/utils"; // cn utility

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 px-6 py-5">
          <CardTitle className="text-3xl font-medium">Sign in</CardTitle>
          <CardDescription>
            Don't have an account?{" "}
            <Link className="text-foreground font-medium underline" href="/sign-up">
              Sign up
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 px-6">
          <form className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="you@example.com" required className="p-3" />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="text-xs text-foreground underline"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="Your password"
                required
                className="p-3"
              />
            </div>

            <SubmitButton pendingText="Signing In..." formAction={signInAction} className="mt-2">
              Sign in
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className="px-6 pb-5">
          <FormMessage message={searchParams} />
        </CardFooter>
      </Card>
    </div>
  );
}
