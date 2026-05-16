import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/schemas";

const statusColors: Record<string, string> = {
  pending: "bg-[#efe9de] text-[#6c6a64]",
  extracted: "bg-[#5db8a6]/15 text-[#3d8a7a]",
  prd_generated: "bg-[#cc785c]/15 text-[#a9583e]",
  reviewing: "bg-[#e8a55a]/15 text-[#b8841a]",
  approved: "bg-[#5db872]/15 text-[#3d8a52]",
  rejected: "bg-[#c64545]/15 text-[#c64545]",
  failed: "bg-[#c64545]/15 text-[#c64545]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`${statusColors[status] || "bg-[#efe9de] text-[#6c6a64]"} rounded-full text-[12px] font-medium px-2.5 py-0.5 border-0`}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    P0: "bg-[#cc785c] text-white",
    P1: "bg-[#e8a55a] text-white",
    P2: "bg-[#efe9de] text-[#6c6a64]",
  };
  return (
    <Badge className={`${colors[priority] || "bg-[#efe9de] text-[#6c6a64]"} rounded-full text-[12px] font-medium px-2.5 py-0.5 border-0`}>
      {PRIORITY_LABELS[priority] || priority}
    </Badge>
  );
}
