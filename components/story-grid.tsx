"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Star } from "lucide-react";
import { StarRatingInput } from "@/components/stories/star-rating-input"; // Import the rating component
import type { User } from "@supabase/supabase-js"; // Import User type

interface StoryForGrid {
  story_id: string;
  title: string | null;
  content: string | null;
  genre: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null;
  created_at?: string | null; // Optional if not displayed directly here
  updated_at?: string | null; // Optional if not displayed directly here
  users: { username: string | null } | null;
  user_rating_value: number; // User's specific rating (0 if none) - Updated field name
  is_public?: boolean; // Optional if only showing public here
}

interface StoryGridProps {
  stories: StoryForGrid[];
  currentUser: User | null; // Accept the current user object
}

export function StoryGrid({ stories, currentUser }: StoryGridProps) {
  if (!stories || stories.length === 0) {
    return <p>No stories available for this page.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stories.map((story) => {
        const authorUsername = story.users?.username;
        const hasAuthor = !!authorUsername;
        // Check if avg_rating exists and is a valid number > 0 for display
        const hasDisplayableAvgRating =
          typeof story.avg_rating === "number" && story.avg_rating > 0;

        // User's specific rating is now directly available
        const userRatingValue = story.user_rating_value;

        return (
          <Card key={story.story_id} className="relative flex flex-col">
            {/* Average Rating Display (Top Right - Read Only Average) for all users */}
            <div
              className="absolute right-3 top-3 flex items-center gap-0.5"
              title={`Average rating: ${hasDisplayableAvgRating ? story.avg_rating?.toFixed(1) : "0.0"}`}
            >
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
              <span className="text-xs font-medium text-muted-foreground">
                {hasDisplayableAvgRating
                  ? `${story.avg_rating?.toFixed(1)} (${story.rating_count || 0})`
                  : "0.0 (0)"}
              </span>
            </div>

            <CardHeader className="pb-2 pr-10">
              {" "}
              {/* Keep padding for rating */}
              <CardTitle>{story.title || "Untitled Story"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pb-2 pt-0">
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {story.content || "No preview available."}
              </p>
            </CardContent>
            <CardFooter className="mt-auto flex flex-col items-start gap-1.5 pt-1">
              {/* Author Info */}
              <div className="w-full">
                {hasAuthor ? (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    By{" "}
                    <Link
                      href={`/users/${authorUsername}`}
                      className="hover:underline"
                    >
                      {authorUsername}
                    </Link>
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {" "}
                    By Unknown Author{" "}
                  </p>
                )}
              </div>

              {/* --- RATING INPUT SECTION --- */}
              {currentUser && (
                <div className="mt-1 w-full">
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    Your Rating:
                  </p>
                  <StarRatingInput
                    storyId={story.story_id}
                    initialRating={userRatingValue} // <-- Use the direct value
                    size={4.5}
                  />
                </div>
              )}
              {/* --- END RATING INPUT SECTION --- */}

              {/* Genre Info */}
              {story.genre && story.genre.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {" "}
                    Genres:{" "}
                  </span>
                  {story.genre.map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="px-1.5 py-0.5 text-xs"
                    >
                      {" "}
                      {g}{" "}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Read More Button */}
              <div className="mt-2 w-full text-right">
                <Link
                  href={`/stories/${story.story_id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Read More
                </Link>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
