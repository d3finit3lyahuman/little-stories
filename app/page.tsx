import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@supabase/supabase-js";
import { UUID } from "crypto";
import Link from "next/link";

type Story = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  genre: JSON;
  is_public: boolean;
  created_at: Date;
};

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*")
    .filter("is_public", "eq", true); // Only fetch public stories

  if (error) {
    console.error("Error fetching stories:", error);
    return <div className="p-4 text-red-500">Error loading stories</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <nav className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Little Stories</h1>
        <div>
          <Link href="/about" className="mr-4">About</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <h1 className="text-3xl font-bold my-6">Stories</h1>
      {stories?.length === 0 ? (
        <p>No stories available yet.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories?.map((story: Story) => (
            <li key={story.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{story.title}</h2>
              <p className="mt-2 line-clamp-3">{story.content}</p>
              <p className="mt-4 text-sm text-gray-600">
                By {story.author_id}
              </p>
              <Link href={`/stories/${story.id}`} className="text-blue-500 mt-2 inline-block">
                Read more
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
