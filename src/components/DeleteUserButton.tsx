"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteUserButton({ userId, username }: { userId: number; username: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    if (!confirm(`حذف المستخدم "${username}"؟`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950"
      aria-label="حذف المستخدم"
    >
      <Trash2 size={14} />
    </button>
  );
}
