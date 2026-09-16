import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function SortableHeader<F extends string>({
  field,
  label,
  activeField,
  activeDir,
  baseQuery,
}: {
  field: F;
  label: string;
  activeField: F;
  activeDir: "asc" | "desc";
  baseQuery: string;
}) {
  const isActive = field === activeField;
  const nextDir = isActive && activeDir === "asc" ? "desc" : "asc";
  const href = `?${baseQuery}sort=${field}-${nextDir}`;
  const Icon = isActive ? (activeDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 hover:text-foreground print:pointer-events-none ${
        isActive ? "text-foreground" : ""
      }`}
    >
      {label}
      <Icon size={13} className="print:hidden" />
    </Link>
  );
}
