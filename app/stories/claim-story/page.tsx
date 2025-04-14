"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { set } from "react-hook-form";
import { claimStoryAction } from "@/app/actions";

type ActionResult =
  | { success: true; story_id: string; message: string }
  | { success: false; error: string };

  export default function ClaimStoryFormPage(){
    const router = useRouter();
    // for pending state without blocking the UI
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult | null>(null);
    const [tokenInput, setTokenInput] = useState<string>("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // prevent default form submission
        setResult(null); // clear previous results

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const actionResult = await claimStoryAction(formData);
            setResult(actionResult); // set the result state

            if (actionResult.success){
                setTokenInput(""); // clear the input field
            }
        });
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Claim Your Story</CardTitle>
            <CardDescription>
              Enter the claim token you saved when submitting as a guest.
              You must be logged in to claim a story.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="claim_token">Claim Token</Label>
                <Input
                  id="claim_token"
                  name="claim_token" // Name attribute for FormData
                  type="text"
                  placeholder="Please provide the claim token"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  disabled={isPending}
                />
              </div>
  
              {/* Display Success/Error Messages */}
              {result && !result.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
              {result && result.success && (
                <Alert variant="default" className="border-green-500 border-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
  
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Claiming..." : "Claim Story"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }