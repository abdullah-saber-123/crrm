import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Header from "@/components/Header";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} نظام المطابقات والتحصيل
      </footer>
    </div>
  );
}
