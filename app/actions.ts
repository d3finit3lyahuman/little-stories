"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import * as z from "zod";

type ActionResult =
  | { success: true; story_id: string; claimToken?: null } // Logged-in user case
  | { success: true; story_id: string; claimToken: string } // Guest user case
  | { success: false; error: string }; // Failure case

type ClaimActionResult =
  | { success: true; story_id: string; message: string }
  | { success: false; error: string };

type UpdateActionResult =
  | { success: true; message: string; updatedUsername?: string }
  | { success: false; error: string };

type UpdateStoryResult =
  | { success: true; message: string; story_id: string }
  | { success: false; error: string };

type RatingActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

  type DeleteResult =
  | { success: true; message: string }
  | { success: false; error: string };

const editProfileSchemaServer = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ), // Example regex
    bio: z
      .string()
      .max(500, "Bio cannot exceed 500 characters")
      .optional()
      .nullable(), // Optional bio
    is_author: z.boolean().default(false),
    is_reader: z.boolean().default(false),
  })
  .refine((data) => data.is_author || data.is_reader, {
    message: "User must be at least a reader or an author.",
  });

const editStorySchema = z.object({
  story_id: z.string().uuid("Invalid Story ID format."), // Validate UUID
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters"),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(10000, "Content cannot exceed 10,000 characters"),
  is_public: z.boolean().optional(),
});

const ratingSchema = z.object({
  story_id: z.string().uuid("Invalid Story ID."),
  rating: z.coerce // Convert string from FormData to number
    .number()
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating cannot exceed 5."),
});

const removeRatingSchema = z.object({
  story_id: z.string().uuid("Invalid Story ID."),
});

const deleteStorySchema = z.object({
  story_id: z.string().uuid("Invalid Story ID format."),
});

export const removeRatingAction = async (
  formData: FormData
): Promise<RatingActionResult> => {
  // Get Client & Authenticated User
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in to remove ratings." };
  }

  // Extract and Validate Data
  const rawData = {
    story_id: formData.get("story_id")?.toString(),
  };

  const validationResult = removeRatingSchema.safeParse(rawData);
  if (!validationResult.success) {
    return { success: false, error: "Invalid story ID provided." };
  }

  const { story_id } = validationResult.data;

  // Attempt to delete the rating
  // Use .match() to ensure we only delete the specific user's rating for this story
  console.log(`Attempting to delete rating for story ${story_id} by user ${user.id}`);
  const { error: deleteError } = await supabase
    .from("ratings")
    .delete()
    .match({
        user_id: user.id,
        story_id: story_id
    });

  // 4. Handle Delete Error
  if (deleteError) {
    console.error("!!! Rating Delete Error:", deleteError);
    let userMessage = "Failed to remove rating. Please try again.";
    if (deleteError.message.includes("permission denied")) {
      // Check RLS DELETE policy on ratings table
      userMessage = "Permission denied to remove rating (RLS issue).";
    }
    return { success: false, error: userMessage };
  }

  // Success! Trigger handles aggregate updates. Revalidate paths.
  console.log(`Successfully processed remove rating request for story ${story_id} by user ${user.id}`);
  revalidatePath(`/stories/${story_id}`);
  revalidatePath(`/`);
  revalidatePath(`/profile/[username]`, 'layout');

  return { success: true, message: "Rating removed successfully!" };
};

export const submitRatingAction = async (
  formData: FormData
): Promise<RatingActionResult> => {
  // Get Client & Authenticated User
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in to rate stories." };
  }

  // Extract and Validate Data
  const rawData = {
    story_id: formData.get("story_id")?.toString(),
    rating: formData.get("rating")?.toString(), // Get as string first
  };

  const validationResult = ratingSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessages = Object.values(
      validationResult.error.flatten().fieldErrors
    )
      .map((errors) => errors?.join(", "))
      .filter(Boolean)
      .join(" ");
    return {
      success: false,
      error: `Invalid input: ${errorMessages || "Check entries."}`,
    };
  }

  const { story_id, rating } = validationResult.data;

  // Prepare data for upsert
  const ratingData = {
    user_id: user.id,
    story_id: story_id,
    rating: rating,
  };

  // Upsert the rating (Insert or Update if exists)
  // Requires the unique constraint on (user_id, story_id)
  console.log(
    `Upserting rating for story ${story_id} by user ${user.id}:`,
    ratingData
  );
  const { error: upsertError } = await supabase
    .from("ratings")
    .upsert(ratingData, {
      onConflict: 'user_id, story_id' // Specify the unique constraint to avoid conflict error
    });

  // Handle Upsert Error
  if (upsertError) {
    console.error("!!! Rating Upsert Error:", upsertError);
    let userMessage = "Failed to submit rating. Please try again.";
    if (upsertError.message.includes("permission denied")) {
      userMessage = "Permission denied to submit rating (RLS issue).";
    } else if (upsertError.message.includes("check constraint")) {
      userMessage = "Invalid rating value (must be 1-5).";
    }
    return { success: false, error: userMessage };
  }

  // Success! Trigger handles aggregate updates. Revalidate paths.
  console.log(
    `Successfully submitted rating for story ${story_id} by user ${user.id}`
  );
  revalidatePath(`/stories/${story_id}`); // Revalidate story page
  revalidatePath(`/`); // Revalidate home page (if ratings shown)
  revalidatePath(`/profile/[username]`, "layout"); // Revalidate profiles

  return { success: true, message: "Rating submitted successfully!" };
};

export const updateStoryAction = async (
  formData: FormData
): Promise<UpdateStoryResult> => {
  // Get Supabase client & Authenticated User
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  // Extract and Validate Data
  const rawData = {
    story_id: formData.get("story_id")?.toString(),
    title: formData.get("title")?.toString()?.trim(),
    content: formData.get("content")?.toString()?.trim(),
    is_public: formData.get("is_public") === "true",
  };

  const validationResult = editStorySchema.safeParse(rawData);
  if (!validationResult.success) {
    const errorMessages = Object.values(
      validationResult.error.flatten().fieldErrors
    )
      .map((errors) => errors?.join(", "))
      .filter(Boolean)
      .join(" ");
    return {
      success: false,
      error: `Invalid input: ${errorMessages || "Check entries."}`,
    };
  }

  const { story_id, title, content, is_public } = validationResult.data;

  // Authorization Check: Verify Ownership
  console.log(`Checking ownership for story ${story_id} by user ${user.id}`);
  const { data: storyOwner, error: ownerCheckError } = await supabase
    .from("stories")
    .select("user_id")
    .eq("story_id", story_id)
    .single<{ user_id: string }>();

  if (ownerCheckError) {
    console.error("Owner check error:", ownerCheckError);
    return { success: false, error: "Could not verify story ownership." };
  }
  if (!storyOwner || storyOwner.user_id !== user.id) {
    console.warn(
      `User ${user.id} attempted to edit story ${story_id} owned by ${storyOwner?.user_id}`
    );
    return {
      success: false,
      error: "You do not have permission to edit this story.",
    };
  }

  // Perform Update
  console.log(`Updating story ${story_id}`);
  const { error: updateError } = await supabase
    .from("stories")
    .update({
      title: title,
      content: content,
      is_public: is_public,
    })
    .eq("story_id", story_id)
    .eq("user_id", user.id); // Double-check ownership in WHERE clause

  // Handle Update Error
  if (updateError) {
    console.error("!!! Story Update Error:", updateError);
    let userMessage = "Failed to update story. Please try again.";
    if (updateError.message.includes("permission denied")) {
      userMessage = "Permission denied to update story (RLS issue).";
    }
    return { success: false, error: userMessage };
  }

  // Success! Revalidate relevant paths
  console.log(`Successfully updated story ${story_id}`);
  revalidatePath(`/stories/${story_id}`); // Revalidate the story page
  revalidatePath(`/profile/[username]`, "layout"); // Revalidate profile pages (use layout for dynamic)
  revalidatePath("/"); // Revalidate home page

  return {
    success: true,
    message: "Story updated successfully!",
    story_id: story_id,
  };
};

export const deleteStoryAction = async (
  formData: FormData
): Promise<DeleteResult> => {
  // Get Client & Authenticated User
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  // Extract and Validate Story ID
  const rawData = {
    story_id: formData.get("story_id")?.toString(),
  };
  const validationResult = deleteStorySchema.safeParse(rawData);
  if (!validationResult.success) {
    return { success: false, error: "Invalid Story ID provided." };
  }
  const { story_id } = validationResult.data;

  // Authorisation Check: Verify Ownership BEFORE deleting
  console.log(`Checking ownership for DELETE on story ${story_id} by user ${user.id}`);
  const { data: storyOwner, error: ownerCheckError } = await supabase
    .from("stories")
    .select("user_id") // Only need user_id for check
    .eq("story_id", story_id)
    .single<{ user_id: string | null }>(); // user_id could potentially be null for guest stories

  if (ownerCheckError) {
    console.error("Owner check error before delete:", ownerCheckError);
    return { success: false, error: "Could not verify story ownership before deleting." };
  }
  // Ensure story exists and belongs to the current user
  if (!storyOwner || storyOwner.user_id !== user.id) {
    console.warn(`User ${user.id} attempted to DELETE story ${story_id} not owned by them (owner: ${storyOwner?.user_id})`);
    return { success: false, error: "You do not have permission to delete this story." };
  }

  // Perform Delete
  console.log(`Attempting to delete story ${story_id}`);
  const { error: deleteError } = await supabase
    .from("stories")
    .delete()
    .eq("story_id", story_id)
    .eq("user_id", user.id); // Crucial: Ensure RLS/query only deletes owned story

  // Handle Delete Error
  if (deleteError) {
    console.error("!!! Story Delete Error:", deleteError);
    let userMessage = "Failed to delete story. Please try again.";
    if (deleteError.message.includes("permission denied")) {
      // Check RLS DELETE policy on stories table
      userMessage = "Permission denied to delete story (RLS issue).";
    }
    return { success: false, error: userMessage };
  }

  // Success! Revalidate paths and prepare for redirect
  console.log(`Successfully deleted story ${story_id}`);
  revalidatePath(`/profile/[username]`, 'layout'); // Revalidate profile pages
  revalidatePath('/'); // Revalidate home page

  // We won't redirect directly here, let the client handle it after success
  return { success: true, message: "Story deleted successfully!" };
};

export const updateProfileAction = async (
  formData: FormData
): Promise<UpdateActionResult> => {
  // Supabase client & AUTHENTICATED user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Update Profile Auth Error:", authError?.message);
    return {
      success: false,
      error: "Authentication failed. Please log in again.",
    };
  }

  // Extract data from FormData
  const rawFormData = {
    username: formData.get("username")?.toString()?.trim(),
    bio: formData.get("bio")?.toString()?.trim() || null,
    // Checkbox values are 'on' if checked, null otherwise. Convert to boolean.
    is_author: formData.get("is_author") === "on",
    is_reader: formData.get("is_reader") === "on",
  };

  // Validate data using Zod schema
  const validationResult = editProfileSchemaServer.safeParse(rawFormData);
  if (!validationResult.success) {
    console.error(
      "Server Validation Error:",
      validationResult.error.flatten().fieldErrors
    );
    // Combine errors into a single string (If I have time, make this prettier)
    const errorMessages = Object.values(
      validationResult.error.flatten().fieldErrors
    )
      .map((errors) => errors?.join(", "))
      .filter(Boolean)
      .join(" ");
    return {
      success: false,
      error: `Invalid input: ${errorMessages || "Please check your entries."}`,
    };
  }

  const validatedData = validationResult.data;

  // Username Uniqueness Check
  // Fetch current profile to compare username
  const { data: currentProfile, error: fetchError } = await supabase
    .from("users")
    .select("username")
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching current profile:", fetchError);
    return { success: false, error: "Could not verify current profile." };
  }

  let usernameChanged = false;
  // If username changed, check if the new one is taken by *another* user
  if (currentProfile && validatedData.username !== currentProfile.username) {
    usernameChanged = true;
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", validatedData.username)
      .neq("user_id", user.id) // Exclude the current user
      .maybeSingle(); // Check if *any other* user has this username

    if (checkError) {
      console.error("Error checking username uniqueness:", checkError);
      return {
        success: false,
        error: "Could not verify username availability.",
      };
    }
    if (existingUser) {
      return {
        success: false,
        error: "Username is already taken. Please choose another.",
      };
    }
  }

  // Update the user's profile in the 'users' table
  console.log(`Attempting to update profile for user: ${user.id}`);
  const { error: updateError } = await supabase
    .from("users")
    .update({
      username: validatedData.username,
      bio: validatedData.bio,
      is_author: validatedData.is_author,
      is_reader: validatedData.is_reader,
    })
    .eq("user_id", user.id); // IMPORTANT: Only update the logged-in user's row

  // Handle Update Error
  if (updateError) {
    console.error("!!! Profile Update Error:", updateError);
    // RLS on UPDATE could cause this
    let userMessage = "Failed to update profile. Please try again later.";
    if (updateError.message.includes("permission denied")) {
      userMessage =
        "Failed to update profile due to permissions. Check RLS UPDATE policies.";
    } else if (
      updateError.code === "23505" &&
      updateError.message.includes("username")
    ) {
      // Catch unique constraint violation again (should be caught earlier but just in case)
      userMessage = "Username is already taken.";
    }
    return { success: false, error: userMessage };
  }

  // Success! Revalidate paths
  console.log(`Successfully updated profile for user: ${user.id}`);
  // Revalidate the user's own profile page (using the potentially new username)
  revalidatePath(`/profile/${validatedData.username}`);
  // Revalidate the generic edit page path too
  revalidatePath("/profile/edit");
  // Revalidate the main nav if it displays username/info
  revalidatePath("/", "layout"); // Revalidate layout to potentially update nav

  return {
    success: true,
    message: "Profile updated successfully!",
    // Only include updatedUsername in the result if it actually changed
    updatedUsername: usernameChanged ? validatedData.username : undefined,
  };
};

export const claimStoryAction = async (
  formData: FormData
): Promise<ClaimActionResult> => {
  // Get Supabase client & check user authentication
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Check if user is logged in
  if (authError || !user) {
    console.error("Claim Story Auth Error:", authError?.message);
    return { success: false, error: "You must be logged in to claim a story." };
  }

  // Get claim token
  const claimToken = formData.get("claim_token")?.toString()?.trim();

  // Validate token format
  if (
    !claimToken ||
    !/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(
      claimToken
    )
  ) {
    return { success: false, error: "Invalid claim token format provided." };
  }

  // Attempt to update the story AND select the ID in one go
  console.log(
    `Attempting to claim story with token: ${claimToken} for user ${user.id}`
  );

  // --- Step 4: Call the database function via RPC ---
  console.log(
    `Attempting to claim story via RPC with token: ${claimToken} for user: ${user.id}`
  );

  const { data: updatedStory, error: rpcError } = await supabase
    .rpc("claim_story", {
      // Pass arguments matching the function definition
      input_claim_token: claimToken,
      claimer_user_id: user.id,
    })
    .select() // Select all columns returned by the function (*)
    .single(); // Expect the function to return the single updated row

  // 5. Handle RPC Errors
  if (rpcError) {
    console.error("!!! Story Claim RPC Error:", rpcError);
    // Check if it's the "no rows" error from .single()
    if (rpcError.code === "PGRST116") {
      console.log(`No unclaimed story found via RPC for token: ${claimToken}`);
      return {
        success: false,
        error:
          "Invalid or already used claim token. Story not found or already claimed.",
      };
    }
    // Handle other potential errors like function not found, permission denied on function etc.
    let userMessage = "Failed to claim story. Please try again later.";
    if (rpcError.message.includes("permission denied")) {
      userMessage = "Permission denied to execute claim function.";
    }
    return { success: false, error: userMessage };
  }

  // 6. Check if data was returned (should be guaranteed by .single() if no error)
  if (!updatedStory?.story_id) {
    // Check specifically for story_id
    console.error(
      `Claim RPC successful according to DB, but no story data returned for token: ${claimToken}`
    );
    return {
      success: false,
      error: "An unexpected error occurred after claiming (missing data).",
    };
  }

  // --- Step 7: Success! ---
  const updatedStoryId = updatedStory.story_id;
  console.log(
    `Successfully claimed story ID: ${updatedStoryId} for user ${user.id} via RPC`
  );

  // Revalidate relevant paths
  revalidatePath("/");
  revalidatePath(`/stories/${updatedStoryId}`);

  return {
    success: true,
    story_id: updatedStoryId,
    message: "Story successfully claimed and linked to your account!",
  };
};

export const createStoryAction = async (
  formData: FormData
): Promise<ActionResult> => {
  // Get Supabase client & check user authentication (doesn't error if no user)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side role check
  if (user) {
    // If logged in, verify they are an author
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_author")
      .eq("user_id", user.id)
      .single<{ is_author: boolean }>(); // Type the expected result

    if (profileError) {
      console.error(
        "Server Action: Error fetching profile for role check:",
        profileError
      );
      return { success: false, error: "Could not verify user role." };
    }
    if (!profile?.is_author) {
      console.warn(
        `User ${user.id} attempted to create story but is not an author.`
      );
      return {
        success: false,
        error: "You do not have permission to create stories.",
      };
    }
    // User is logged in AND is an author - proceed
  }

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
      return { success: false, error: userMessage }; // Return error object
    }
    if (!newStoryData?.story_id) {
      console.error(
        "Story Insert Success but no story_id returned (Logged-in)."
      );
      return { success: false, error: "Failed to create story (missing ID)." }; // Return error object
    }

    // Success! Revalidate and redirect to story page
    console.log(
      `Successfully inserted story ID: ${newStoryData.story_id} for user ${user.id}`
    );
    revalidatePath("/");
    revalidatePath(`/stories/${newStoryData.story_id}`); // Revalidate the specific story page

    return { success: true, story_id: newStoryData.story_id }; // Return success object
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
    console.log("Attempting to insert story for guest user");
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
      return { success: false, error: userMessage }; // Return error object
    }
    if (!newStoryData?.story_id) {
      console.error("Story Insert Success but no story_id returned (Guest).");
      return { success: false, error: "Failed to create story (missing ID)." }; // Return error object
    }

    // Success! Redirect to a page to show the claim token
    console.log(
      `Successfully inserted guest story ID: ${newStoryData.story_id} with token: ${claimToken}`
    );
    revalidatePath("/"); // Revalidate public story lists

    return {
      success: true,
      story_id: newStoryData.story_id,
      claimToken: claimToken,
    }; // Return success object
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
    redirectTo: `${origin}/auth/callback?next=/protected/reset-password`,
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
