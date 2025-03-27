import { createClient } from "@/utils/supabase";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = createClient();

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*, users(username)")
    .eq("is_public", true);

  if (error) {
    console.error("Error fetching stories:", error);
    return <div className="p-4 text-red-500">Error loading stories</div>;
  }

  return (
    <div className="container mx-auto py-5">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stories</h1>
        <p className="text-muted-foreground">
          Explore a collection of captivating stories.
        </p>
      </div>

      {stories?.length === 0 ? (
        <p>No stories available yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card key={story.story_id}>
              <CardHeader>
                <CardTitle>{story.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {story.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
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
      )}
    </div>
  );
}
