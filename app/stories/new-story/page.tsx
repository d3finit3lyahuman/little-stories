"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Info, AlertCircle, Globe, Lock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createStoryAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

// --- Define available genres (replace with your actual list) ---
const AVAILABLE_GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical",
  "Horror",
  "Adventure",
  "Other",
] as const; // Use 'as const' for stricter typing

// --- Update Zod Schema ---
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(150, {
    message: "Title cannot exceed 150 characters",
  }), // Added max length
  content: z
    .string()
    .min(50, { message: "Content must be at least 50 characters" }) // Increased min length slightly
    .max(10000, { message: "Content cannot exceed 10,000 characters" }), // Increased max length
  genres: z
    .array(z.string())
    .min(1, { message: "Please select at least one genre." }), // Require at least one genre
  is_public: z.boolean().default(true), // Default to true
});

type ActionResult =
  | { success: true; storyId: string; claimToken?: string | null }
  | { success: false; error: string };

interface UserProfileData {
  is_author: boolean;
}

const NewStoryPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State to store user session
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null); // State to store user profile data
  const [authChecked, setAuthChecked] = useState(false); // State to check if auth is checked

  //  --- Fetch user session to check if logged in ---
  useEffect(() => {
    const supabase = createClient();
    const getUserSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user); // Set user session
    };
    getUserSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user ?? null); // Update user session on auth state change
      }
    );
    return () => {
      authListener?.subscription.unsubscribe(); // Cleanup subscription on unmount
    };
  }, []); // Empty dependency array to run once on mount

   // --- Fetch user session AND profile data ---
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const checkUserAccess = async () => {
      setAuthChecked(false); // Start check
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError || !user) {
        // User is not logged in (guest) - ALLOW access
        setCurrentUser(null);
        setUserProfile(null);
        setAuthChecked(true); // Auth check complete
        return;
      }

      // User is logged in, set user and fetch profile
      setCurrentUser(user);
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_author") // Only need is_author for this check
        .eq("user_id", user.id)
        .single<UserProfileData>();

      if (!isMounted) return;

      if (profileError) {
        console.error("Error fetching user profile for access check:", profileError);
        // Handle error - maybe redirect or show error? For now, deny access.
        setServerError("Could not verify user role.");
        setUserProfile(null); // Assume not author if profile fetch fails
      } else {
        setUserProfile(profile);
        // --- ACCESS CONTROL LOGIC ---
        if (!profile?.is_author) {
          // User is logged in but NOT an author - Redirect away
          console.log("User is not an author, redirecting...");
          router.replace("/"); // Redirect to home page (or show an access denied message)
          // No need to setAuthChecked(true) here as we are navigating away
          return; // Stop further execution in this effect run
        }
      }
      setAuthChecked(true); // Auth check complete
    };

    checkUserAccess();
    
    return () => {
      isMounted = false;
    };
  }, [router]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      genres: [],
      is_public: true, // Default to public
    },
  });

  const isPublicValue = form.watch("is_public"); // Watch the is_public field

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setServerError(null); // Reset server error state
    setShowClaimDialog(false); // Reset claim dialog state
    setClaimToken(null); // Reset claim token state

    // create FormData object
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);
    values.genres.forEach((genre) => formData.append("genres", genre));
    formData.append("is_public", String(values.is_public)); // Append is_public value

    //Call server action
    const result = await createStoryAction(formData);

    setIsLoading(false); // Reset loading state

    if (result.success) {
      form.reset(); // Reset form fields
      if (result.claimToken) {
        setClaimToken(result.claimToken); // Set claim token for dialog
        setShowClaimDialog(true); // Show claim dialog
      } else {
        // Alert user that the story was created successfully
        alert("Story created successfully!"); // Replace with your preferred notification method
      }
    } else {
      setServerError(result.error); // Set server error message
    }
  }

  const handleCopy = () => {
    if (claimToken) {
      navigator.clipboard
        .writeText(claimToken)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        })
        .catch((error) => console.error("Failed to copy: ", error));
    }
  };

    // --- Render loading state or access denied ---
    if (!authChecked) {
      // Show loading indicator while checking auth/profile
      return (
        <div className="flex min-h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Fallback in case redirection fails
    if (currentUser && !userProfile?.is_author) {
      return (
        <div className="container mx-auto max-w-3xl py-10 text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must have an Author role to create stories.
            </AlertDescription>
          </Alert>
        </div>
      );
   }

  //  --- Render the form if user is logged in and is an author ---
  return (
    <>
      <div className="container mx-auto max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Story</CardTitle>
            <CardDescription>
              Share your creativity with the world. Guests can submit too!
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter story title"
                          {...field}
                          maxLength={150}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Genres */}
                <FormField
                  control={form.control}
                  name="genres"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Genres</FormLabel>
                        <FormDescription>
                          Select one or more genres.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {AVAILABLE_GENRES.map((genre) => (
                          <FormField
                            key={genre}
                            control={form.control}
                            name="genres"
                            render={({ field }) => (
                              <FormItem
                                key={genre}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(genre)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            genre,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (v) => v !== genre
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {genre}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your story here..."
                          {...field}
                          maxLength={10000}
                          className="min-h-[250px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Min 50, Max 10,000 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- Visibility Toggle --- */}
                <FormField control={form.control} name="is_public" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Visibility</FormLabel>
                      <FormDescription>
                        {currentUser // Check currentUser state here
                          ? "Public stories are visible to everyone. Private stories are only visible to you."
                          : "Guest stories are always public."}
                      </FormDescription>
                    </div>
                    <FormControl>
                        {/* Disable switch if no user is logged in */}
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!currentUser || isLoading} // Disable if no user or loading
                          aria-readonly={!currentUser} // Accessibility hint
                        />
                      </FormControl>
                      {/* Only show icons when user is logged in */}
                      {currentUser && (
                        <div className="ml-2">
                          {isPublicValue ? (
                            <Globe className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Lock className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                {/* --- End Visibility Toggle --- */}

                {/* Display Server Errors */}
                {serverError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Story"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      {/* Claim Token Alert Dialog */}
      <AlertDialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              Story Submitted! Save Your Claim Token
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <strong>Keep this token safe and private!</strong> It's the only
              way to link this story to your account later.{" "}
              <strong className="text-destructive">
                You will only see this once.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 rounded-md border bg-muted p-4 font-mono text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="break-all">{claimToken}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy claim token"
                className="h-7 w-7 flex-shrink-0"
              >
                <Copy className={`h-4 w-4 ${copied ? "text-green-600" : ""}`} />
              </Button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-green-600 text-right">Copied!</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClaimDialog(false)}>
              OK, I've Saved It
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NewStoryPage;
