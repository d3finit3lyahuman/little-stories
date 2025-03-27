import { createClient } from "@/utils/supabase";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/back-button" // Import the new client component

export default async function Page({
  params,
}: {
  params: { story_id: string };
}) {
  // 1. Fix destructuring: Remove await
  const { story_id } = await params;

  const supabase = createClient();

  const { data: story, error } = await supabase
    .from("stories")
    .select("*, users(username)")
    .eq("story_id", story_id)
    .single();

  return (
    <div className="container mx-auto flex justify-center py-8">
      {error ? (
        <div className="text-red-500">Error loading story: {error.message}</div>
      ) : !story ? (
        <div>Story not found</div>
      ) : (
        // 2. Fix JSX structure: Card should be inside the div
        <div className="w-full max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {story.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                By {story.users?.username || "Unknown Author"}
              </p>
            </CardHeader>
            <CardContent>
              {/* Ensure story.content exists and is a string before splitting */}
              <div className="prose max-w-none">
                {story.content && typeof story.content === "string"
                  ? story.content.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4">
                        {paragraph}
                      </p>
                    ))
                  : // Optional: Handle cases where content might be missing or not a string
                    "No content available."}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {/* 3. Use the Client Component for the button */}
              <p className="text-sm text-muted-foreground">
                {/* Add check for created_at existence */}
                {story.created_at
                  ? new Date(story.created_at).toLocaleDateString()
                  : "Date unknown"}
              </p>
              <BackButton />
            </CardFooter>
          </Card>
        </div> // Closing tag for max-w-2xl div
      )}
    </div>
  );
}
