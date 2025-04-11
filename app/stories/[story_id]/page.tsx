import { createClient } from "@/utils/supabase";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/back-button";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 
import Link from "next/link"; 

// Interface for story data
interface StoryData {
  story_id: string;
  title: string | null;
  content: string | null;
  created_at: string | null;
  genre?: string[] | null; 
  avg_rating?: number | null; 
  users: { username: string | null } | null;
}

export default async function Page(
  props: {
    params: Promise<{ story_id: string }>;
  }
) {

  const params = await props.params;
  const { story_id } = params;

  const supabase = createClient();

  // Fetch necessary fields
  const { data: story, error } = await supabase
    .from("stories")
    .select("*, users(username)")
    .eq("story_id", story_id)
    .single<StoryData>();

  // Helper checks
  const hasRating = typeof story?.avg_rating === "number";
  const authorUsername = story?.users?.username;
  const hasAuthor = !!authorUsername;
  const hasGenre = story?.genre && story.genre.length > 0;
  const formattedDate = story?.created_at
    ? new Date(story.created_at).toLocaleDateString()
    : null;

  return (
    <div className="container mx-auto flex justify-center py-8">
      {error ? (
        <div className="text-red-500">Error loading story: {error.message}</div>
      ) : !story ? (
        <div>Story not found</div>
      ) : (
        <div className="w-full max-w-2xl">
          {/* Add relative positioning for absolute date */}
          <Card className="relative shadow-lg">
            {/* Published Date */}
            {formattedDate && (
              <div className="absolute right-4 top-4 text-xs text-muted-foreground">
                Published: {formattedDate}
              </div>
            )}

            {/* Card Header - Adjust padding for date */}
            <CardHeader className="pr-28"> 
              <CardTitle className="text-2xl font-bold">
                {story.title || "Untitled Story"}
              </CardTitle>

              {/* Author and Rating Info Combined */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"> 
                {/* Author Part */}
                {hasAuthor ? (
                  <p className="text-sm text-muted-foreground">
                    By{" "}
                    <Link
                      href={`/users/${authorUsername}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {authorUsername}
                    </Link>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    By Unknown Author
                  </p>
                )}

                {/* Rating Part */}
                {hasRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {story.avg_rating?.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                {story.content && typeof story.content === "string"
                  ? story.content.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))
                  : "No content available."}
              </div>
            </CardContent>
            {/* Footer */}
            <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              {/* Genre Display */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {hasGenre && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-1 text-xs font-semibold text-muted-foreground">
                      Genres:
                    </span>
                    {story.genre?.map((g) => (
                      <Badge
                        key={g}
                        variant="secondary"
                        className="px-1.5 py-0.5 text-xs"
                      >
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <BackButton />
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
