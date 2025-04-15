"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useParams
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Loader2, Globe, Lock, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateStoryAction, deleteStoryAction } from "@/app/actions"; // Import the update action
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const editStorySchemaClient = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters"),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(10000, "Content cannot exceed 10,000 characters"),
  is_public: z.boolean().optional(), // Optional, if you want
});

type UpdateStoryResult =
  | { success: true; message: string; story_id: string }
  | { success: false; error: string };

type DeleteResult =
  | { success: true; message: string }
  | { success: false; error: string };

interface StoryEditData {
  title: string;
  content: string;
  is_public?: boolean;
}

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams(); // Get route parameters
  const storyId = params.story_id as string; // Extract story_id
  const { toast } = useToast();

  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition(); // For delete action
  const [initialLoading, setInitialLoading] = useState(true);
  const [updateResult, setUpdateResult] = useState<UpdateStoryResult | null>(
    null
  );
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null); // For delete action
  const [loadError, setLoadError] = useState<string | null>(null); // Error during initial load

  const form = useForm<z.infer<typeof editStorySchemaClient>>({
    resolver: zodResolver(editStorySchemaClient),
    defaultValues: { title: "", content: "" }, // Initialize empty
  });

  // Watch for changes in the is_public field
  const isPublicValue = form.watch("is_public");

  // --- Fetch story data and check ownership on mount ---
  useEffect(() => {
    if (!storyId) {
      setLoadError("Story ID not found in URL.");
      setInitialLoading(false);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    const fetchStoryAndCheckAuth = async () => {
      setInitialLoading(true);
      setLoadError(null);

      // Check logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (authError || !user) {
        console.error("Not authenticated:", authError?.message);
        router.replace("/sign-in"); // Redirect if not logged in
        return;
      }

      // Fetch story data
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("title, content, user_id, is_public") // Select needed fields + user_id for check
        .eq("story_id", storyId)
        .single<StoryEditData & { user_id: string }>(); // Add user_id to type

      if (!isMounted) return;

      if (storyError) {
        console.error("Error fetching story:", storyError);
        setLoadError("Could not load story data. It might not exist.");
        setInitialLoading(false);
        return;
      }

      // Check ownership
      if (storyData.user_id !== user.id) {
        console.warn("User does not own this story.");
        setLoadError("You do not have permission to edit this story.");
        // Redirect to home if not owner
        setTimeout(() => {
          router.replace("/");
        }, 1500);
        setInitialLoading(false);
        return;
      }

      // Populate form
      form.reset({
        title: storyData.title || "",
        content: storyData.content || "",
        is_public: storyData.is_public ?? true,
      });
      setInitialLoading(false);
    };

    fetchStoryAndCheckAuth();

    return () => {
      isMounted = false;
    };
  }, [storyId, router, form]); // Include dependencies

  // --- Handle Update Submission ---
  async function onUpdateSubmit(values: z.infer<typeof editStorySchemaClient>) {
    setUpdateResult(null);
    setDeleteResult(null);

    const formData = new FormData();
    formData.append("story_id", storyId); // Include story_id in form data
    formData.append("title", values.title);
    formData.append("content", values.content);
    formData.append("is_public", String(values.is_public));

    startUpdateTransition(async () => {
      const actionResult = await updateStoryAction(formData);
      setUpdateResult(actionResult);

      if (actionResult.success) {
        toast({
          title: "Success!",
          description: actionResult.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Update Failed",
          description: actionResult.error,
          variant: "destructive",
        });
      }
    });
  }

  // --- Handle Delete Action ---
  const handleDeleteConfirm = () => {
    setUpdateResult(null); // Clear other results
    setDeleteResult(null);

    const formData = new FormData();
    formData.append("story_id", storyId);

    startDeleteTransition(async () => {
      const actionResult = await deleteStoryAction(formData);
      setDeleteResult(actionResult); // Set delete result state

      if (actionResult.success) {
        toast({
          title: "Story Deleted",
          description: actionResult.message,
          variant: "default",
        });
        // Redirect to profile or home page after successful deletion
        router.push("/"); // Or router.push('/profile/your-username');
      } else {
        toast({
          title: "Delete Failed",
          description: actionResult.error,
          variant: "destructive",
        });
      }
    });
  };

  // --- Render Logic ---
  if (initialLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto max-w-2xl py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
      {" "}
      {/* Consistent width */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Story</CardTitle>
          <CardDescription>Make changes or delete your story.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdateSubmit)}>
            <CardContent className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Story title" {...field} />
                    </FormControl>
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
                        placeholder="Your story..."
                        className="min-h-[300px]"
                        maxLength={10000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Max 10,000 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Visibility Toggle --- */}
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Visibility</FormLabel>
                      <FormDescription>
                        Public stories are visible to everyone. Private stories
                        are only visible to you.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUpdatePending || initialLoading} // Disable while loading/saving
                        aria-readonly={isUpdatePending || initialLoading}
                      />
                    </FormControl>
                    {/* Icon indicator */}
                    <div className="ml-2">
                      {isPublicValue ? (
                        <Globe className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </FormItem>
                )}
              />
              {/* --- End Visibility Toggle --- */}

              {/* Display Update Action Results */}
              {updateResult && !updateResult.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Update Failed</AlertTitle>
                  <AlertDescription>{updateResult.error}</AlertDescription>
                </Alert>
              )}
              {updateResult && updateResult.success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>{updateResult.message}</AlertDescription>
                </Alert>
              )}
              {/* Display Delete Action Results (might be cleared by update attempt) */}
              {deleteResult && !deleteResult.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Delete Failed</AlertTitle>
                  <AlertDescription>{deleteResult.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-3">
               {/* Delete Button with Confirmation */}
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button
                       variant="destructive"
                       type="button" // Important: prevent form submission
                       disabled={isDeletePending || initialLoading}
                     >
                       <Trash2 className="mr-2 h-4 w-4" />
                       {isDeletePending ? "Deleting..." : "Delete Story"}
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                       <AlertDialogDescription>
                         This action cannot be undone. This will permanently delete your
                         story and all associated data (like ratings).
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel disabled={isDeletePending}>Cancel</AlertDialogCancel>
                       {/* Action button calls the delete handler */}
                       <AlertDialogAction
                         onClick={handleDeleteConfirm}
                         disabled={isDeletePending}
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90" // Destructive style
                       >
                         {isDeletePending ? "Deleting..." : "Yes, delete story"}
                       </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>

               {/* Save and Cancel Buttons */}
               <div className="flex gap-3">
                  <Button variant="ghost" type="button" asChild disabled={isUpdatePending || isDeletePending}>
                     <Link href={`/stories/${storyId}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isUpdatePending || isDeletePending || initialLoading}>
                    {isUpdatePending ? "Saving..." : "Save Changes"}
                  </Button>
               </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
