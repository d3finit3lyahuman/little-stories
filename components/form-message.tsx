// components/form-message.tsx
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
// Import appropriate icons
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

// Your existing Message type
export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

interface FormMessageProps {
  message: Message;
}

export function FormMessage({ message }: FormMessageProps) {
  if (!message) {
    return null; // Don't render anything if no message object is provided
  }

  let variant: "default" | "destructive" = "default";
  let IconComponent = Info; // Default icon
  let title = "Information";
  let text = "";

  if ("error" in message) {
    variant = "destructive";
    IconComponent = AlertCircle;
    title = "Error";
    text = message.error;
  } else if ("success" in message) {
    // Use default variant for success, but a specific icon/title
    variant = "default"; // Or create a custom "success" variant if desired
    IconComponent = CheckCircle2;
    title = "Success";
    text = message.success;
    // Optional: Add specific success styling classes if not using a custom variant
    // className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-500 [&>svg]:text-green-500"
  } else if ("message" in message) {
    variant = "default";
    IconComponent = Info;
    title = "Information";
    text = message.message;
  } else {
    // Should not happen with the defined type, but good practice
    return null;
  }

  return (
    // Apply w-full here if you want the Alert to take the full width of its container
    <Alert variant={variant} className="w-full">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
