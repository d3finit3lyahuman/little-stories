import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function formatDate(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const wasEdited = (createdAt: string | null, updatedAt: string | null): boolean => {
  if (!updatedAt || !createdAt) return false;
  try {
      const createdTime = new Date(createdAt).getTime();
      const updatedTime = new Date(updatedAt).getTime();
      // Check if updated_at is significantly later than created_at (> 60 seconds)
      return updatedTime > (createdTime + 60000);
  } catch (e) {
      return false; 
  }
};

