import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listUsers } from "@/lib/users-repo";
import { formatDate } from "@/lib/format";
import CreateUserForm from "@/components/CreateUserForm";
import DeleteUserButton from "@/components/DeleteUserButton";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير",
  agent: "موظف",
};

export default async function UsersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") redirect("/customers");

  const users = await listUsers();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <p className="mb-6 text-sm text-muted">
        إدارة حسابات الدخول والصلاحيات. المدير يقدر يؤكّد المرشّحين ويدير المستخدمين، والموظف يقدر يرشّح فقط.
      </p>

      <div className="mb-6">
        <CreateUserForm />
      </div>

      <section className="card overflow-hidden">
        <h2 className="px-5 pt-5 text-sm font-semibold text-muted">المستخدمون</h2>
        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">اسم المستخدم</th>
                <th className="px-3 py-2 font-medium">الاسم</th>
                <th className="px-3 py-2 font-medium">الصلاحية</th>
                <th className="px-3 py-2 font-medium">تاريخ الإضافة</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-card-border">
                  <td className="px-3 py-3 font-medium">{u.username}</td>
                  <td className="px-3 py-3">{u.name}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-3">
                    <DeleteUserButton userId={u.id} username={u.username} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    لا يوجد مستخدمون بعد (بإمكانك الدخول دائمًا بحساب المدير الافتراضي من متغيرات البيئة).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
