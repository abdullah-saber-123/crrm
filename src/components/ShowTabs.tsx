import Link from "next/link";

export default function ShowTabs({
  showId,
  active,
  isAdmin,
}: {
  showId: number;
  active: "customers" | "nominees";
  isAdmin: boolean;
}) {
  const tabs = [
    { key: "customers" as const, href: `/collections/${showId}/customers`, label: "كل العملاء" },
    ...(isAdmin
      ? [{ key: "nominees" as const, href: `/collections/${showId}/nominees`, label: "المرشّحون" }]
      : []),
  ];

  return (
    <div className="mb-6 flex items-center gap-2">
      <Link href="/collections" className="text-sm text-muted hover:underline">
        ← العروض
      </Link>
      <div className="mx-2 h-4 w-px bg-card-border" />
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            active === tab.key ? "text-white" : "border border-card-border text-muted"
          }`}
          style={active === tab.key ? { backgroundColor: "var(--accent)" } : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
