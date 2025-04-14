"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

type ActionResult =
  | { success: true; story_id: string; claimToken?: null } // Logged-in user case
  | { success: true; story_id: string; claimToken: string } // Guest user case
  | { success: false; error: string }; // Failure case

export const createStoryAction = async (formData: FormData): Promise<ActionResult> => {
  // Get Supabase client & check user authentication (doesn't error if no user)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get form data
  const title = formData.get("title")?.toString()?.trim();
  const content = formData.get("content")?.toString()?.trim();
  const genres = formData.getAll("genres") as string[];
  const isPublicString = formData.get("is_public")?.toString(); 

  // Server-side Validation
  if (!title || title.length === 0) {
    return encodedRedirect("error", "/stories/new-story", "Title is required.");
  }
  if (title.length > 150) {
    return encodedRedirect(
      "error",
      "/stories/new-story",
      "Title cannot exceed 150 characters."
    );
  }
  if (!content || content.length < 50) {
    return encodedRedirect(
      "error",
      "/stories/new-story",
      "Content must be at least 50 characters."
    );
  }
  if (content.length > 10000) {
    return encodedRedirect(
      "error",
      "/stories/new-story",
      "Content cannot exceed 10,000 characters."
    );
  }
  if (!genres || genres.length === 0) {
    return encodedRedirect(
      "error",
      "/stories/new-story",
      "Please select at least one genre."
    );
  }

  let isPublic = true;
  if (user && isPublicString === "false") {
    // If logged-in user, allow user to set story as private
    isPublic = false;
  }

  // --- Logic Branching: Logged-in vs Guest ---
  if (user) {
    // --- LOGGED-IN USER FLOW ---

    // Prepare data for insertion (logged-in)
    const storyData = {
      user_id: user.id, // Link to the logged-in user
      title: title,
      content: content,
      genre: genres,
      is_public: isPublic,
      avg_rating: 0,
      rating_count: 0,
      claim_token: null, // No token needed
    };

    // Insert story and select ID
    console.log("Attempting to insert story for logged-in user:", storyData);
    const { data: newStoryData, error: insertError } = await supabase
      .from("stories")
      .insert(storyData)
      .select("story_id")
      .single();

    // Handle Insertion Error
    if (insertError) {
      console.error("!!! Story Insert Error (Logged-in):", insertError);
      let userMessage = "Failed to create story. Please try again.";
      if (insertError.message.includes("permission denied")) {
        userMessage = "Failed to save story due to permissions. Check RLS.";
      }
      return {success: false, error: userMessage}; // Return error object
    }
    if (!newStoryData?.story_id) {
      console.error(
        "Story Insert Success but no story_id returned (Logged-in)."
      );
      return {success: false, error: "Failed to create story (missing ID)."}; // Return error object
    }

    // Success! Revalidate and redirect to story page
    console.log(
      `Successfully inserted story ID: ${newStoryData.story_id} for user ${user.id}`
    );
    revalidatePath("/");
    revalidatePath(`/stories/${newStoryData.story_id}`); // Revalidate the specific story page

    return {success: true, story_id: newStoryData.story_id}; // Return success object
  } else {
    // --- GUEST USER FLOW ---

    // Generate a unique claim token
    const claimToken = crypto.randomUUID();

    // Prepare data for insertion (guest)
    const storyData = {
      user_id: null, // No user linked
      title: title,
      content: content,
      genre: genres,
      is_public: true,
      avg_rating: 0,
      rating_count: 0,
      claim_token: claimToken, // Assign the generated token
    };

    // Insert story and select ID
    console.log("Attempting to insert story for guest user:", storyData);
    const { data: newStoryData, error: insertError } = await supabase
      .from("stories")
      .insert(storyData)
      .select("story_id") // Still need the ID for the claim page (maybe)
      .single();

    //Handle Insertion Error
    if (insertError) {
      console.error("!!! Story Insert Error (Guest):", insertError);
      let userMessage = "Failed to create story. Please try again.";
      // RLS for guests inserting stories? Ensure anon role can insert if user_id is NULL.
      if (insertError.message.includes("permission denied")) {
        userMessage =
          "Failed to save story due to permissions. Check RLS for guest submissions.";
      }
      return {success: false, error: userMessage}; // Return error object
    }
    if (!newStoryData?.story_id) {
      console.error("Story Insert Success but no story_id returned (Guest).");
      return {success: false, error: "Failed to create story (missing ID)."}; // Return error object
    }

    // Success! Redirect to a page to show the claim token
    console.log(
      `Successfully inserted guest story ID: ${newStoryData.story_id} with token: ${claimToken}`
    );
    revalidatePath("/"); // Revalidate public story lists

    return {success: true, story_id: newStoryData.story_id, claimToken: claimToken}; // Return success object
  }
};

export const signUpAction = async (formData: FormData) => {
  // Get form data
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const username = formData.get("username")?.toString()?.trim();
  const isAuthor = formData.has("is_author");
  const isReader = formData.has("is_reader");

  const headerList = await headers();
  const origin = headerList.get("origin");

  // Basic Validation
  if (!email || !password || !username) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Username, email, and password are required."
    );
  }
  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must be at least 6 characters long."
    );
  }
  if (!isAuthor && !isReader) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Please select at least one role (Author or Reader)."
    );
  }

  // Create Supabase Client
  const supabase = await createClient();

  // Sign up the user - Pass necessary data in options.data for the trigger
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensure data needed by the trigger is passed here
      data: {
        username: username,
        is_author: isAuthor,
        is_reader: isReader,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  // Handle Auth Sign Up Errors
  if (authError) {
    console.error("Auth SignUp Error:", authError.code, authError.message);
    let userMessage = authError.message;
    if (authError.message.includes("User already registered")) {
      userMessage =
        "This email address is already registered. Please try signing in.";
    } else if (
      authError.message.includes("Password should be at least 6 characters")
    ) {
      userMessage = "Password must be at least 6 characters long.";
    }
    // Check for unique username violation if the trigger fails
    else if (
      authError.message.includes(
        "duplicate key value violates unique constraint"
      ) &&
      authError.message.includes("users_username_key")
    ) {
      userMessage = "This username is already taken. Please choose another.";
    }
    return encodedRedirect("error", "/sign-up", userMessage);
  }

  // Check if user object exists (as before)
  if (!authData.user) {
    console.error("Auth SignUp Success but no user data returned.");
    return encodedRedirect(
      "error",
      "/sign-up",
      "An unexpected error occurred during sign up."
    );
  }

  // Success! Auth user created, trigger will handle profile.
  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

// Sign In Action
export const signInAction = async (formData: FormData) => {
  // Get form data
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle Sign In Errors
  if (error) {
    let userMessage = error.message;
    if (error.message === "Invalid login credentials") {
      userMessage = "Incorrect email or password. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      userMessage =
        "Please verify your email address before signing in. Check your inbox for the verification link.";
    }
    return encodedRedirect("error", "/sign-in", userMessage);
  }
  return redirect("/"); // Redirect to home on success
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Forgot Password Error:", error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not send password reset email. Please check the address and try again."
    );
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "If an account exists for this email, a password reset link has been sent."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required"
    );
  }
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match"
    );
  }
  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password must be at least 6 characters long."
    );
  }

  const { error } = await supabase.auth.updateUser({ password: password });

  if (error) {
    console.error("Reset Password Error:", error.message);
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password update failed. The link may have expired or the password might not meet requirements."
    );
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Password updated successfully. Please sign in."
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Redirect to home page after sign out might be nicer than sign-in
  return redirect("/");
};
