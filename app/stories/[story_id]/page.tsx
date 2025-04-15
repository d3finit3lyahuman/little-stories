import { createClient } from "@/utils/supabase/server";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/back-button";
import { Star, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StarRatingInput } from "@/components/stories/star-rating-input";
import { wasEdited } from "@/utils/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Interface for base story data fetched
interface StoryBaseData {
  story_id: string;
  user_id: string | null;
  title: string | null;
  content: string | null;
  created_at: string | null;
  updated_at?: string | null;
  genre?: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null;
  users: { username: string | null } | null; 
}

export default async function Page(
  props: {
    params: Promise<{ story_id: string }>;
  }
) {
  const params = await props.params;
  const { story_id } = params;

  // Validate story_id format early 
  if (!/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(story_id)) {
      console.error("Invalid story_id format in URL");
      notFound();
  }

  const supabase = await createClient();

  // --- Get Current Logged-in User ---
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id;

  // --- Fetch Base Story Data + Author ---
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select(`
        *,
        user_id,
        users ( username )
    `) 
    .eq("story_id", story_id)
    .single<StoryBaseData>(); 

  // Handle story not found or fetch error
  if (storyError || !story) {
    console.error("Story fetch error or not found:", storyError?.message);
    notFound(); 
  }

  // --- Fetch User's Rating (if logged in) ---
  let userRatingValue = 0; // Default to 0
  if (currentUserId) {
    const { data: ratingData, error: ratingError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("user_id", currentUserId)
      .eq("story_id", story_id) 
      .maybeSingle<{ rating: number }>(); // Use maybeSingle as rating might not exist

    if (ratingError) {
      console.error("Error fetching user rating:", ratingError.message);
      // Proceed without user rating, maybe show a toast later if needed
    } else if (ratingData) {
      userRatingValue = ratingData.rating ?? 0;
    }
  }

  // --- Prepare Data & Checks ---
  const isOwner = !!currentUser && currentUser.id === story.user_id;
  const hasAvgRating = typeof story.avg_rating === "number" && story.avg_rating >= 0;
  const authorUsername = story.users?.username;
  const hasAuthor = !!authorUsername;
  const hasGenre = story.genre && story.genre.length > 0;
  const formattedDate = story.created_at ? new Date(story.created_at).toLocaleDateString() : null;

  return (
    <div className="container mx-auto flex justify-center py-8">
      <div className="w-full max-w-2xl">
        <Card className="relative shadow-lg">
          {/* Published Date & Edited Status */}
          <div className="absolute right-4 top-4 text-right text-xs text-muted-foreground">
            {formattedDate && <div>Published: {formattedDate}</div>}
            {wasEdited(story.created_at, story.updated_at || null) && <div className="italic">(Edited)</div>}
          </div>

          <CardHeader className="pr-28">
            <CardTitle className="text-2xl font-bold">
              {story.title || "Untitled Story"}
            </CardTitle>
            {/* Author */}
            <div className="mt-1">
              {hasAuthor ? (
                <p className="text-sm text-muted-foreground"> By{" "} <Link href={`/profile/${authorUsername}`} className="font-medium text-primary hover:underline"> {authorUsername} </Link> </p>
              ) : ( <p className="text-sm text-muted-foreground"> By Unknown Author </p> )}
            </div>
            {/* Average Rating */}
            {hasAvgRating && (
                <div className="mt-1 flex items-center gap-1" title={`Average rating: ${story.avg_rating?.toFixed(1)}`}>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {story.avg_rating?.toFixed(1)}
                        <span className="ml-1 text-xs">({story.rating_count ?? 0} {story.rating_count === 1 ? 'rating' : 'ratings'})</span>
                    </span>
                </div>
            )}
          </CardHeader>

          <CardContent>
             <div className="prose max-w-none dark:prose-invert">
              {story.content && typeof story.content === "string"
                ? story.content.split("\n").map((p, i) => <p key={i} className="mb-4 last:mb-0">{p}</p>)
                : "No content available."}
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Genres */}
            <div className="flex flex-wrap items-center gap-1">
              {hasGenre && (
                <>
                  <span className="mr-1 text-xs font-semibold text-muted-foreground">Genres:</span>
                  {story.genre?.map((g) => ( <Badge key={g} variant="secondary" className="px-1.5 py-0.5 text-xs">{g}</Badge> ))}
                </>
              )}
            </div>

            {/* Middle: User Rating Input (only if logged in) */}
            <div className="flex justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
              {currentUser && (
                <div className="text-center">
                  <StarRatingInput
                    storyId={story.story_id}
                    initialRating={userRatingValue} // Use fetched value
                    size={5}
                  />
                </div>
              )}
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex w-full justify-end gap-2 sm:w-auto">
              {/* EDIT BUTTON (Conditional) */}
              {isOwner && (
                <Link
                  href={`/stories/${story.story_id}/edit`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  aria-label="Edit Story"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              )}
              <BackButton />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
