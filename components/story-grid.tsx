import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Story {
  story_id: string;
  title: string | null;
  content: string | null;
  genre: string[]; // Genre information as an array of strings
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
      {stories.map((story) => (
        <Card key={story.story_id}>
          <CardHeader>
            <CardTitle>{story.title || "Untitled Story"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {story.content || "No preview available."}
            </p>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Genre: {story.genre && story.genre.length > 0 ? story.genre.join(', ') : "N/A"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Link href={`/users/${story.users?.username}`} className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">
                By {story.users?.username || "Unknown Author"}
              </p>
            </Link>
            <Link href={`/stories/${story.story_id}`}>
              <Button variant="outline" size="sm">
                Read More
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
