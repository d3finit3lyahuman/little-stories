// app/protected/reset-password/page.tsx (or wherever)
import { resetPasswordAction } from "@/app/actions";
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


interface ResetPasswordProps {
    searchParams: Promise<Message | { [key: string]: string | string[] | undefined }>;
}

export default async function ResetPassword(props: ResetPasswordProps) {
  const searchParams = await props.searchParams;
  // Check if the searchParams object contains expected keys
  const isMessageObject = "message" in searchParams || "error" in searchParams || "success" in searchParams;

  // Display error message if present
  // Only checking for 'error' as success redirects elsewhere
  if (isMessageObject && "error" in searchParams) {
    const messageData = searchParams as Message; // Cast only after check
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-md">
          <FormMessage message={messageData} />
           <div className="mt-4 text-center">
             <Button variant="link" asChild>
                <Link href="/forgot-password">Try Again</Link>
             </Button>
           </div>
        </div>
      </div>
    );
  }

  // Render the form if no relevant error message
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Please enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <form action={resetPasswordAction}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
             {/* Optional: Inline error display (usually handled by top block) */}
             {isMessageObject && "error" in searchParams && (
                 <FormMessage message={searchParams as Message} />
             )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton
              className="w-full"
              pendingText="Resetting Password..."
            >
              Reset Password
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
