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
  users: { username: string | null } | null; // Assuming users can be null
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
          {/* ... Card content using story data ... */}
          <CardHeader>
            <CardTitle>{story.title || "Untitled Story"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {story.content || "No preview available."}
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              By {story.users?.username || "Unknown Author"}
            </p>
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
