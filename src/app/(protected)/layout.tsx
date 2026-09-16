import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar isAdmin={user.role === "admin"} />
      <div className="flex min-h-full flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
