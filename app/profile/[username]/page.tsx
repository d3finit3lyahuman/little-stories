import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation"; // For handling profile not found
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Example avatar
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { UserProfileStories } from "@/components/profile/user-profile-stories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User as UserIcon, Edit } from "lucide-react"; 
import { cn } from "@/lib/utils";

interface ProfileData {
  user_id: string;
  username: string;
  is_author: boolean;
  is_reader: boolean;
  created_at: string | null;
  bio?: string | null;
}

export default async function ProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const params = await props.params;
  const profileUsername = params.username;

  const supabase = await createClient();

  // --- Fetch the profile being viewed ---
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("*") // Select all profile fields for now
    .eq("username", profileUsername)
    .single<ProfileData>();

  // Handle profile not found
  if (profileError || !profileData) {
    console.error("Profile fetch error or not found:", profileError?.message);
    notFound(); // Render the 404 page
  }

  // --- Fetch the currently logged-in user (viewer) ---
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwner = currentUser?.id === profileData.user_id;

  // --- Fetch the stories for this profile ---
  let storiesQuery = supabase
    .from("stories")
    .select(
      "story_id, title, content, genre, avg_rating, created_at, is_public"
    )
    .eq("user_id", profileData.user_id) // Filter by profile owner's ID
    .order("created_at", { ascending: false }); // Order by newest first

  // Adjust query based on viewer
  if (!isOwner) {
    // Visitors only see public stories
    storiesQuery = storiesQuery.eq("is_public", true);
  }
  // Owners see all their stories (no extra filter needed here)


  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Fetch stories data and error status separately
  const { data: stories, error: storiesFetchError } = await storiesQuery;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* --- Profile Header --- */}
      <Card className="mb-8 overflow-hidden">
      <CardHeader className="flex flex-col items-center gap-4 bg-muted/40 p-6 text-center sm:flex-row sm:text-left">
        <Avatar className="h-20 w-20 border">
        <AvatarFallback className="text-2xl">
          {profileData.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 gap-1">
        <CardTitle className="text-2xl font-bold">
          {profileData.username}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Joined {formatDate(profileData.created_at)}
        </CardDescription>
        <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
          {profileData.is_author && (
          <Badge variant="secondary">Author</Badge>
          )}
          {profileData.is_reader && (
          <Badge variant="secondary">Reader</Badge>
          )}
        </div>
        </div>
        {isOwner && (
        <Link
          href="/profile/edit"
          className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-4 sm:ml-auto sm:mt-0"
          )}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Link>
        )}
      </CardHeader>

      {/* --- Bio Section --- */}
      <CardContent className="px-6 pb-6 pt-4">
        <div className="rounded-md bg-background/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserIcon className="h-4 w-4 text-primary/70" />
          <h3 className="text-sm font-medium text-primary">About</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {profileData.bio || "No bio yet."}
        </p>
        </div>
      </CardContent>
      {/* --- End  Bio Section --- */}
      </Card>

      {/* --- Stories Section --- */}
      <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        Stories by {profileData.username}
      </h2>

      {/* Render the Client Component for stories */}
      <UserProfileStories
        stories={stories}
        storiesError={!!storiesFetchError}
        isOwner={isOwner} 
        username={profileData.username}
      />
      </div>
    </div>
  );
}
