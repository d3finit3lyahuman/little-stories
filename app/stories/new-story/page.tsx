"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter, // Added CardFooter for structure
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription, // Added FormDescription
  FormMessage, // Added FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Define available genres (replace with your actual list) ---
const AVAILABLE_GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical",
  "Horror",
  "Adventure",
  "Other",
] as const; // Use 'as const' for stricter typing

// --- Update Zod Schema ---
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(150, {
    message: "Title cannot exceed 150 characters",
  }), // Added max length
  content: z
    .string()
    .min(50, { message: "Content must be at least 50 characters" }) // Increased min length slightly
    .max(10000, { message: "Content cannot exceed 10,000 characters" }), // Increased max length
  genres: z
    .array(z.string())
    .min(1, { message: "Please select at least one genre." }), // Require at least one genre
});

const NewStoryPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      genres: [], // Initialize genres as an empty array
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form Submitted:", values);
    // --- Future Implementation ---
    // 1. Check user authentication status (e.g., using Supabase client)
    // 2. If logged in:
    //    - Prepare data: { title, content, genres, user_id: loggedInUserId }
    //    - Call server action/API to insert into 'stories' table.
    // 3. If guest:
    //    - Generate a unique claim_token (e.g., using crypto.randomUUID())
    //    - Prepare data: { title, content, genres, user_id: null, claim_token: generatedToken }
    //    - Call server action/API to insert into 'stories' table.
    //    - **IMPORTANT**: After successful insertion, redirect or update UI to show the generatedToken to the user ONCE.
    // 4. Handle success/error states (e.g., show toast notifications).
    alert(
      "Form submitted (check console). Actual saving logic not implemented yet."
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-10"> {/* Centered content */}
      <Card>
        <CardHeader>
          <CardTitle>Create a New Story</CardTitle>
          <CardDescription>
            Share your creativity with the world. Guests can submit too!
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter story title" {...field} />
                    </FormControl>
                    <FormMessage /> {/* Show title errors */}
                  </FormItem>
                )}
              />

              {/* --- Genre Selection --- */}
              <FormField
                control={form.control}
                name="genres"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Genres</FormLabel>
                      <FormDescription>
                        Select one or more genres that fit your story.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {AVAILABLE_GENRES.map((genre) => (
                        <FormField
                          key={genre}
                          control={form.control}
                          name="genres"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={genre}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(genre)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            genre,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== genre
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {genre}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage /> {/* Show genre errors */}
                  </FormItem>
                )}
              />
              {/* --- End Genre Selection --- */}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your story here..."
                        maxLength={10000} // Match schema
                        className="min-h-[250px]" // Slightly taller
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max 10,000 characters.
                    </FormDescription>
                    <FormMessage /> {/* Show content errors */}
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Submit Story
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default NewStoryPage;
