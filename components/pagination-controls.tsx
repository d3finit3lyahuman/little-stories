import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string; // Optional: base path if not root '/'
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl = "/",
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null; // Don't render controls if only one page
  }

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  // Helper to create page links, handling page=1 case
  const getPageLink = (page: number) => {
    if (page <= 1) return baseUrl; // Link to base for page 1
    return `${baseUrl}?page=${page}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center space-x-4">
      {currentPage > 1 && (
        <Link href={getPageLink(prevPage)}>
          <Button variant="outline" size="sm">
            Previous
          </Button>
        </Link>
      )}

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link href={getPageLink(nextPage)}>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </Link>
      )}
    </div>
  );
}
