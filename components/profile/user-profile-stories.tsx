"use client"; 
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Star, AlertCircle, Edit } from "lucide-react";
import { formatDate, wasEdited } from "@/utils/utils";

// Re-define or import necessary types
interface StoryData {
  story_id: string;
  title: string | null;
  content: string | null;
  genre: string[] | null;
  avg_rating?: number | null;
  created_at: string | null;
  updated_at?: string | null;
  is_public: boolean;
}

interface UserProfileStoriesProps {
  stories: StoryData[] | null;
  storiesError: boolean; // Pass error status
  isOwner: boolean;
  username: string;
}

export function UserProfileStories({
  stories,
  storiesError,
  isOwner,
  username,
}: UserProfileStoriesProps) {

  // Handle error state first
  if (storiesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Stories</AlertTitle>
        <AlertDescription>
          Could not load stories for this user. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle empty state
  if (!stories || stories.length === 0) {
    return (
      <p className="text-muted-foreground">
        {isOwner
          ? "You haven't written any stories yet."
          : `${username} hasn't published any public stories yet.`}
      </p>
    );
  }

  // Render the Carousel if stories exist
  return (
    <Carousel
      opts={{
        align: "start",
        // loop: true, // Optional: enable looping
      }}
      className="w-full" // Adjust width as needed
    >
      <CarouselContent className="-ml-4"> 
        {stories.map((story) => (
          <CarouselItem key={story.story_id} className="pl-4 md:basis-1/2 lg:basis-1/3">
            <div className="p-1"> 
              {/* --- Story Card --- */}
              <Card className="flex h-full flex-col"> 
                <CardHeader className="relative pb-3"> 
                  {isOwner && !story.is_public && (
                    <Badge variant="outline" className="absolute right-3 top-3 text-xs">
                      Private
                    </Badge>
                  )}
                  <CardTitle className="line-clamp-2 text-lg">
                    {story.title || "Untitled Story"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pb-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {story.content || "No preview available."}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto flex flex-col items-start gap-2 border-t pt-3 text-xs">
                  {typeof story.avg_rating === 'number' && story.avg_rating > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                      <span>{story.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {story.genre && story.genre.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {story.genre.map((g) => ( // Removed :any type
                        <Badge key={g} variant="secondary" className="px-1.5 py-0.5 text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  )}

                  

                  {/* Date and Edited Status */}
                  <p className="text-muted-foreground">
                     Published: {formatDate(story.created_at)}
                     {/* --- ADDED EDITED INDICATOR --- */}
                     {wasEdited(story.created_at, story.updated_at || null) && (
                        <span className="italic"> (Edited)</span>
                     )}
                     {/* --- END EDITED INDICATOR --- */}
                  </p>
                  {/* ... (Actions: Edit/Read More buttons) ... */}
                   <div className="mt-2 flex w-full justify-end gap-2">
                    {isOwner && (
                      <Link href={`/stories/${story.story_id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Edit
                      </Link>
                    )}
                    <Link href={`/stories/${story.story_id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Read More
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-[-15px] top-1/2 -translate-y-1/2 sm:left-[-50px]" /> {/* Position buttons */}
      <CarouselNext className="absolute right-[-15px] top-1/2 -translate-y-1/2 sm:right-[-50px]" />
    </Carousel>
  );
}
