import { createClient } from "@/utils/supabase/server"; // Use server client
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/back-button";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js"; // Import User type
import { StarRatingInput } from "@/components/stories/star-rating-input";
import { wasEdited } from "@/utils/utils"; 

// Update interface to include rating_count and potentially user_rating
interface StoryData {
  story_id: string;
  title: string | null;
  content: string | null;
  created_at: string | null;
  updated_at?: string | null; // Add if needed for edited status
  genre?: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null; // Add rating_count
  users: { username: string | null } | null;
  // Structure for user's rating from the join
  user_rating: { rating: number }[] | null;
}

export default async function Page(
  props: {
    params: Promise<{ story_id: string }>;
  }
) {
  const params = await props.params;
  const { story_id } = params;

  const supabase = await createClient();

  // --- Get Current Logged-in User ---
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id;

  // --- Fetch Story Data + Author + User's Rating ---
  let storyQuery = supabase
    .from("stories")
    .select(`
        *,
        users ( username ),
        user_rating: ratings ( rating )
    `) // Select story, author, user's rating
    .eq("story_id", story_id);

  // --- Filter the joined ratings by the current user ID ---
  if (currentUserId) {
      storyQuery = storyQuery.eq('ratings.user_id', currentUserId);
  } else {
      // Ensure we still get the story even if no rating matches (user not logged in)
      // This might require the join to be LEFT JOIN implicitly or explicitly
      // Or fetch rating separately if this causes issues
  }

  const { data: story, error } = await storyQuery.single<StoryData>(); // Expect single story

  // Handle story not found or fetch error
  if (error || !story) {
    console.error("Story fetch error or not found:", error?.message);
    notFound();
  }

  // Extract user's rating from the potentially nested structure
  const userRatingValue = story.user_rating?.[0]?.rating ?? 0;

  // Helper checks (as before)
  const hasAvgRating = typeof story.avg_rating === "number" && story.avg_rating >= 0; // Check >= 0
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

          <CardHeader className="pr-28"> {/* Keep padding */}
            <CardTitle className="text-2xl font-bold">
              {story.title || "Untitled Story"}
            </CardTitle>

            {/* Author */}
            <div className="mt-1">
              {hasAuthor ? (
                <p className="text-sm text-muted-foreground"> By{" "} <Link href={`/profile/${authorUsername}`} className="font-medium text-primary hover:underline"> {authorUsername} </Link> </p>
              ) : ( <p className="text-sm text-muted-foreground"> By Unknown Author </p> )}
            </div>

            {/* Average Rating Display (Read Only) - Moved from footer for clarity */}
            {hasAvgRating && (
                <div className="mt-1 flex items-center gap-1" title={`Average rating: ${story.avg_rating?.toFixed(1)}`}>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {story.avg_rating?.toFixed(1)}
                        <span className="ml-1 text-xs">({story.rating_count ?? 0})</span>
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
            <CardFooter className="border-t pt-4">
            <div className="grid w-full grid-cols-3 items-center">
              {/* Left side: Genres */}
              <div className="flex flex-wrap items-center gap-1">
              {hasGenre && (
                <>
                <span className="mr-1 text-xs font-semibold text-muted-foreground">Genres:</span>
                {story.genre?.map((g) => (
                  <Badge key={g} variant="secondary" className="px-1.5 py-0.5 text-xs">{g}</Badge>
                ))}
                </>
              )}
              </div>
              
              {/* Middle: User Rating Input (only if logged in) */}
              <div className="flex justify-center">
              {currentUser && (
                <div className="text-center">
                {/* <p className="mb-0.5 text-xs font-medium text-muted-foreground">Your Rating</p> */}
                <StarRatingInput
                  storyId={story.story_id}
                  initialRating={userRatingValue}
                  size={5}
                />
                </div>
              )}
              </div>
              
              {/* Right side: Back Button */}
              <div className="flex justify-end">
              <BackButton />
              </div>
            </div>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
