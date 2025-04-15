"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { submitRatingAction, removeRatingAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface StarRatingInputProps {
  storyId: string;
  initialRating?: number | null; // User's current rating for this story
  size?: number; // Optional size for stars (e.g., 4 for h-4 w-4)
  readOnly?: boolean; // If true, just display, don't allow input
  currentAvgRating?: number | null; // For read-only display
  ratingCount?: number | null; // For read-only display
}

export function StarRatingInput({
  storyId,
  initialRating = 0,
  size = 4,
  readOnly = false,
  currentAvgRating = null,
  ratingCount = null,
}: StarRatingInputProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Update internal state if initialRating prop changes
  useEffect(() => {
    setRating(initialRating ?? 0);
  }, [initialRating]);

const handleRating = (newRating: number) => {
    if (readOnly || isPending) return;

    // If clicking the same star, treat it as removing the rating
    const finalRating = rating === newRating ? 0 : newRating;
    
    // Optimistic update
    const previousRating = rating;
    setRating(finalRating);

    const formData = new FormData();
    formData.append("story_id", storyId);
    
    startTransition(async () => {
        try {
            let result;
            
            if (finalRating === 0) {
                // Remove rating
                result = await removeRatingAction(formData);
            } else {
                // Submit new rating
                formData.append("rating", finalRating.toString());
                result = await submitRatingAction(formData);
            }
            
            if (!result.success) {
                setRating(previousRating); // Revert on error
                toast({
                    title: finalRating === 0 ? "Error Removing Rating" : "Rating Error",
                    description: result.error || "Failed to update rating.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: finalRating === 0 ? "Rating Removed" : "Rating Submitted",
                    description: result.message || "Your rating has been saved.",
                    variant: "default",
                });
            }
        } catch (error) {
            setRating(previousRating);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    });
};

  const starSizeClass = `h-${size} w-${size}`;
  const displayRating = readOnly ? (currentAvgRating ?? 0) : rating;
  const displayHover = readOnly ? 0 : hoverRating;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        readOnly ? "cursor-default" : ""
      )}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button" // Prevent form submission if nested
          variant="ghost"
          size="icon"
          className={cn(
            "h-auto p-0", // Remove default button padding/height
            readOnly ? "cursor-default" : "cursor-pointer",
            isPending ? "cursor-wait opacity-50" : ""
          )}
          onClick={() => !readOnly && handleRating(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          disabled={isPending || readOnly}
          aria-label={
            readOnly
              ? `Rating: ${displayRating.toFixed(1)} stars`
              : `Rate ${star} star${star > 1 ? 's' : ''}${star === rating ? ' (Click again to remove)' : ''}` 
          }        
        >
          <Star
            className={cn(
              starSizeClass,
              (displayHover > 0 ? star <= displayHover : star <= displayRating)
                ? "fill-yellow-400 text-yellow-500" // Filled star color
                : "text-muted-foreground" // Empty star color
            )}
          />
        </Button>
      ))}
      {/* Optional: Display average rating and count in read-only mode */}
      {readOnly && typeof currentAvgRating === "number" && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          ({currentAvgRating.toFixed(1)}
          {typeof ratingCount === "number" && ratingCount > 0
            ? ` / ${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}`
            : ""}
          )
        </span>
      )}
    </div>
  );
}
