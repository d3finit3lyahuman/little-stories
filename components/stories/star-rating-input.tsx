"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; 
import { submitRatingAction } from "@/app/actions";
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

  const handleRatingSubmit = (newRating: number) => {
    if (readOnly || isPending) return; // Don't submit if read-only or pending

    // Optimistic update -- store previous rating for potential rollback
    const previousRating = rating;
    
    // Only update if the rating is actually changing
    if (previousRating !== newRating) {
      setRating(newRating);
    } else {
      // If clicking the same star, treat it as removing the rating
      setRating(0);
      newRating = 0; // Update the value being submitted
    }

    const formData = new FormData();
    formData.append("story_id", storyId);
    formData.append("rating", newRating.toString());

    startTransition(async () => {
      const result = await submitRatingAction(formData);
      if (!result.success) {
        // Revert optimistic update on error
        setRating(previousRating);
        toast({
          title: "Rating Error",
          description: result.error || "Failed to submit rating.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Rating Submitted",
          description: "Your rating has been saved.",
          variant: "default",
        });
        // No need to manually setRating again, trigger should update data eventually
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
          onClick={() => !readOnly && handleRatingSubmit(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          disabled={isPending || readOnly}
          aria-label={
            readOnly
              ? `Rating: ${displayRating.toFixed(1)} stars`
              : `Rate ${star} star${star > 1 ? "s" : ""}`
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
