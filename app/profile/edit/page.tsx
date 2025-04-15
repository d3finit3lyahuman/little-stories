"use client";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProfileAction } from "@/app/actions"; 
import { createClient } from "@/utils/supabase/client"; 
import type { User } from "@supabase/supabase-js";

// --- Zod Schema for Client-Side Validation ---
const editProfileSchemaClient = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  is_author: z.boolean().default(false),
  is_reader: z.boolean().default(false),
}).refine(data => data.is_author || data.is_reader, {
  message: "You must select at least one role.",
  path: ["is_author"], // This will show the error under the first checkbox
});


type UpdateActionResult =
  | { success: true; message: string; updatedUsername?: string }
  | { success: false; error: string };


export default function EditProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition(); // For async state updates
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState<UpdateActionResult | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof editProfileSchemaClient>>({
    resolver: zodResolver(editProfileSchemaClient),
    defaultValues: { 
      username: "",
      bio: "",
      is_author: false,
      is_reader: false,
    },
  });

  // --- Fetch current profile data on mount ---
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true; // Prevent state update on unmounted component

    const fetchProfile = async () => {
      setInitialLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Not authenticated:", authError?.message);
        router.push("/sign-in"); // Redirect if not logged in
        return;
      }
      if (!isMounted) return; // Check if component is still mounted
      setCurrentUser(user);

      // Fetch profile data from 'users' table
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("username, bio, is_author, is_reader")
        .eq("user_id", user.id)
        .single();

      if (!isMounted) return; // Check again

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setResult({ success: false, error: "Could not load your profile data." });
      } else if (profileData) {
        // Populate form with fetched data
        form.reset({
          username: profileData.username || "",
          bio: profileData.bio || "",
          is_author: profileData.is_author || false,
          is_reader: profileData.is_reader || false,
        });
      }
      setInitialLoading(false);
    };

    fetchProfile();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [router, form]); // Add form to dependency array for form.reset

  // --- Handle Form Submission ---
  async function onSubmit(values: z.infer<typeof editProfileSchemaClient>) {
    setResult(null); // Clear previous results

    const formData = new FormData();
    formData.append("username", values.username);
    if (values.bio) formData.append("bio", values.bio); // Only append if not null/empty
    // Append checkboxes based on boolean value
    if (values.is_author) formData.append("is_author", "on");
    if (values.is_reader) formData.append("is_reader", "on");


    startTransition(async () => {
      const actionResult = await updateProfileAction(formData);
      setResult(actionResult);
    });
  }

  // --- Render Logic ---
  if (initialLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10"> {/* Adjusted max-width */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>
            Update your username, bio, and roles.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Username */}
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="Your unique username" {...field} /></FormControl>
                  <FormDescription>Must be unique. Letters, numbers, underscores only.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Bio */}
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little about yourself (optional)"
                      className="min-h-[100px]"
                      maxLength={500}
                      {...field}
                      value={field.value ?? ''} // Handle null value for textarea
                    />
                  </FormControl>
                  <FormDescription>Max 500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Roles */}
              <FormItem>
                 <div className="mb-4">
                    <FormLabel className="text-base">Your Roles</FormLabel>
                    <FormDescription>Select at least one role.</FormDescription>
                 </div>
                 <div className="flex space-x-6">
                    <FormField control={form.control} name="is_author" render={({ field }) => (
                       <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="font-normal">Story Author</FormLabel>
                       </FormItem>
                    )} />
                     <FormField control={form.control} name="is_reader" render={({ field }) => (
                       <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="font-normal">Reader</FormLabel>
                       </FormItem>
                    )} />
                 </div>
                 {/* Display combined role error if needed */}
                 {form.formState.errors.is_author && !form.formState.errors.is_reader && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.is_author.message}</p>
                 )}
              </FormItem>


              {/* Display Action Results */}
              {result && !result.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Update Failed</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
              {result && result.success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isPending || initialLoading}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
