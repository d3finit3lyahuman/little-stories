import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Star } from "lucide-react";

interface Story {
  story_id: string;
  title: string | null;
  content: string | null;
  genre: string[];
  avg_rating?: number | null;
  users: { username: string | null } | null;
}

interface StoryGridProps {
  stories: Story[];
}

export function StoryGrid({ stories }: StoryGridProps) {
  if (!stories || stories.length === 0) {
    return <p>No stories available for this page.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stories.map((story) => {
        const authorUsername = story.users?.username;
        const hasAuthor = !!authorUsername;
        const hasRating = typeof story.avg_rating === "number";

        return (
          // Add relative positioning to the Card for absolute positioning of the rating
          <Card key={story.story_id} className="relative flex flex-col">
            {/* Rating Info */}
            {hasRating && (
              <div className="absolute right-3 top-3 flex items-center gap-0.5">
                {/* Muted star, no fill */}
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {/* Format rating */}
                  {story.avg_rating?.toFixed(1)}
                </span>
              </div>
            )}

            {/* Card Header */}
            <CardHeader className="pb-2 pr-10">
              {" "}
              <CardTitle>{story.title || "Untitled Story"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pb-2 pt-0">
                <p className="text-sm text-muted-foreground break-words whitespace-normal overflow-hidden">
                {story.content && story.content.length > 200
                  ? `${story.content.slice(0, 200)}...`
                  : story.content || "No preview available."}
                </p>
            </CardContent>
            <CardFooter className="mt-auto flex flex-col items-start gap-1.5 pt-1">
              {/* --- Author Info --- */}
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
                    By Unknown Author
                  </p>
                )}
              </div>
              {/* --- End Author Info --- */}

              {/* Genre Info */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Genres:
                </span>
                {story.genre && story.genre.length > 0 ? (
                  story.genre.map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="px-1.5 py-0.5 text-xs"
                    >
                      {g}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    N/A
                  </span>
                )}
              </div>

              {/* Read More Button */}
              <div className="w-full text-right">
                {/* Rating info removed from here */}
                <Link href={`/stories/${story.story_id}`}>
                  <Button variant="outline" size="sm">
                    Read More
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
