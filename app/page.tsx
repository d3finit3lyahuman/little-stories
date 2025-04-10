// app/page.tsx (or your route file)
import { createClient } from "@/utils/supabase";
import { StoryGrid } from "@/components/story-grid"; // Import components
import { PaginationControls } from "@/components/pagination-controls"; // Import components

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 9;

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const supabase = createClient();

  // --- Data Fetching ---
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const currentPage = !isNaN(page) && page > 0 ? page : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const rangeEnd = offset + ITEMS_PER_PAGE - 1;

  const {
    data: stories, 
    error,
    count,
  } = await supabase
    .from("stories")
    .select("*, users(username)", { count: "exact" })
    .eq("is_public", true)
    .order("avg_rating", { ascending: false })
    .range(offset, rangeEnd);

  if (error) {
    console.error("Error fetching stories:", error);
    return <div className="p-4 text-red-500">Error loading stories</div>;
  }

  const totalStories = count || 0;
  const totalPages = Math.ceil(totalStories / ITEMS_PER_PAGE);
  // --- End Data Fetching ---

  return (
    <div className="container mx-auto py-5">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Stories</h1>
        <p className="text-muted-foreground">
          Explore a collection of captivating stories.
        </p>
      </div>
      <StoryGrid stories={stories || []} />
      <PaginationControls currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
