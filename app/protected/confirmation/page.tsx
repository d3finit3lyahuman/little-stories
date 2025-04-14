"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { CheckCircle2 } from "lucide-react"; 

const ConfirmationPage = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Redirect to the home page after countdown
    const timer = setTimeout(() => {
      router.push("/"); 
    }, 5000);

    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    // Use standard centering layout
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          {" "}
          {/* Center content */}
          {/* Icon */}
          <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
          {/* Title */}
          <CardTitle className="text-2xl text-green-600">
            Registration Successful!
          </CardTitle>
          {/* Description */}
          <CardDescription>
            Thank you for registering. Your account is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {/* Countdown Text */}
          <p className="text-sm text-muted-foreground">
            You will be redirected to the home page in {countdown} seconds...
          </p>
        </CardContent>
        <CardFooter>
          {/* Button Link */}
          <Button className="w-full" asChild>
            <Link href="/">Go to Home Page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmationPage;
