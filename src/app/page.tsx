import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <Dashboard userEmail={user.email ?? ""} />
    </div>
  );
}
