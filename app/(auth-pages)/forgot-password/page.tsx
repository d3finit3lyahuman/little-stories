import { forgotPasswordAction } from "@/app/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Correct the props type definition
interface ForgotPasswordProps {
    searchParams: Promise<Message | { [key: string]: string | string[] | undefined }>;
}

// Destructure searchParams directly from props
export default async function ForgotPassword(props: ForgotPasswordProps) {
  const searchParams = await props.searchParams;

  // Check if the searchParams object contains one of the keys from your Message type
  const isMessageObject = "message" in searchParams || "error" in searchParams || "success" in searchParams;

  // Display success/error message using the Alert-based FormMessage if present
  if (isMessageObject) {
    // Only cast to Message if we know it matches the structure
    const messageData = searchParams as Message;
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-md">
          <FormMessage message={messageData} />
           <div className="mt-4 text-center">
             <Button variant="link" asChild>
                <Link href="/sign-in">Back to Sign In</Link>
             </Button>
           </div>
        </div>
      </div>
    );
  }

  // Render the form if no relevant message param is present
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email address below and we'll send you a link to reset
            your password. Remember your password?{" "}
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </CardDescription>
        </CardHeader>
        <form action={forgotPasswordAction}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton
              className="w-full"
              pendingText="Sending Reset Link..."
            >
              Send Reset Link
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
