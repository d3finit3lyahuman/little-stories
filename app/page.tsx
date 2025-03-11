import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";

type Story = {
  id: number;
  title: string;
  author: string;
  content: string;
}

export default async function Home() {
  return (
    <>
    <h1>Hello My People</h1>
    <Link href="/about">About</Link>
    </>
  );
}
