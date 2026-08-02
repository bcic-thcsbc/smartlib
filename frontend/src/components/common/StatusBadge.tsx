import type { ReactNode } from "react";

type Tone = "available" | "pending" | "active" | "overdue" | "neutral";

const toneByStatus: Record<string, Tone> = {
  active: "active", approved: "active", borrowed: "active",
  fulfilled: "available", available: "available", returned: "available", resolved: "available",
  waived: "neutral",
  pending: "pending", reserved: "pending", partially_returned: "pending", open: "pending",
  overdue: "overdue", rejected: "overdue", cancelled: "overdue", expired: "overdue", lost: "overdue", damaged: "overdue",
};

export function StatusBadge({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`status status-${toneByStatus[status] || "neutral"}`}>{children}</span>;
}
