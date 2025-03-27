"use client"; // Mark this as a Client Component

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // Use Next.js router

export function BackButton() {
  const router = useRouter();

  return (
    <Button variant="outline" onClick={() => router.back()}>
      Back
    </Button>
  );
}
