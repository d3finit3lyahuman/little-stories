// app/page.tsx
import { createClient } from "@/utils/supabase/server"; // Use server client
import { StoryGrid } from "@/components/story-grid";
import { PaginationControls } from "@/components/pagination-controls";
import type { User } from "@supabase/supabase-js";

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

// Base Story type (match definition in StoryGrid or import)
interface Story {
  story_id: string;
  title: string | null;
  content: string | null;
  genre: string[] | null;
  created_at: string | null;
  updated_at?: string | null;
  is_public: boolean;
  avg_rating: number | null;
  rating_count: number | null;
  users: { username: string | null } | null;
}

// Type for the data structure passed to StoryGrid
// Includes the user's specific rating (could be null/0 if not rated)
export interface StoryForGridDisplay extends Omit<Story, 'users'> {
  user_rating_value: number; // User's specific rating (0 if none)
  users: { username: string | null } | null;
}

const ITEMS_PER_PAGE = 9;

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // --- Get Current User ---
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id;

  // --- Fetch Paginated Stories ---
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const currentPage = !isNaN(page) && page > 0 ? page : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const rangeEnd = offset + ITEMS_PER_PAGE - 1;

  const {
    data: baseStories, // Fetch base story data
    error: storiesError,
    count,
  } = await supabase
    .from("stories")
    .select(
        `
            story_id, title, content, genre, created_at, updated_at, is_public,
            avg_rating, rating_count,
            users ( username )
        `, // Select specific fields needed + author
        { count: "exact" }
    )
    .eq("is_public", true)
    .order("avg_rating", { ascending: false }) // Or avg_rating if preferred
    .range(offset, rangeEnd);

  if (storiesError) {
    console.error("Error fetching stories:", storiesError);
    return <div className="p-4 text-red-500">Error loading stories</div>;
  }

  // --- Fetch User's Ratings for these stories (if logged in) ---
  const userRatingsMap = new Map<string, number>(); // Map story_id -> user's rating

  if (currentUserId && baseStories && baseStories.length > 0) {
    const storyIds = baseStories.map(s => s.story_id); // Get IDs of fetched stories

    const { data: ratingsData, error: ratingsError } = await supabase
      .from("ratings")
      .select("story_id, rating")
      .eq("user_id", currentUserId) // Only this user's ratings
      .in("story_id", storyIds); // Only for the stories on this page

    if (ratingsError) {
      console.error("Error fetching user ratings:", ratingsError);
      // Decide how to handle - maybe proceed without user ratings?
    } else if (ratingsData) {
      // Populate the map
      ratingsData.forEach(r => {
        if (r.story_id && r.rating) { // Ensure data is valid
            userRatingsMap.set(r.story_id, r.rating);
        }
      });
    }
  }
  // --- Combine Story Data with User Ratings ---
  const storiesForGrid: StoryForGridDisplay[] = (baseStories ?? []).map(story => ({
    ...story,
    // Get rating from map, default to 0 if not found
    user_rating_value: userRatingsMap.get(story.story_id) ?? 0,
    // Ensure users is in the correct format
    users: Array.isArray(story.users) ? story.users[0] : story.users,
  }));



  // --- Pagination Calculation ---
  const totalStories = count || 0;
  const totalPages = Math.ceil(totalStories / ITEMS_PER_PAGE);

  // --- Render Page ---
  return (
    <div className="container mx-auto py-5">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Stories</h1>
        <p className="text-muted-foreground">
          Explore a collection of captivating stories.
        </p>
      </div>
      {/* Pass combined stories data and current user */}
      <StoryGrid
        stories={storiesForGrid}
        currentUser={currentUser} // Pass the user object
      />
      <PaginationControls currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
