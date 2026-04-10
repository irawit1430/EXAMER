import React from "react";
import Badge from "@/components/ui/Badge";
import { Clock, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import type { ConceptStatus } from "@/types";

interface ConceptCardProps {
  name: string;
  subject: string;
  status: ConceptStatus;
  mastery: number; // 0-100
  mistakeCount: number;
  lastTested?: string;
  onClick?: () => void;
}

const statusConfig: Record<
  ConceptStatus,
  {
    variant: "new" | "learning" | "review" | "mastered";
    icon: React.ElementType;
  }
> = {
  new: { variant: "new", icon: AlertTriangle },
  learning: { variant: "learning", icon: RotateCcw },
  review_24h: { variant: "review", icon: Clock },
  mastered: { variant: "mastered", icon: CheckCircle2 },
};

export default function ConceptCard({
  name,
  subject,
  status,
  mastery,
  mistakeCount,
  lastTested,
  onClick,
}: ConceptCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-50 border border-border-subtle p-5 rounded-[20px] shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-text-primary truncate group-hover:text-brand-primary transition-colors">
            {name}
          </p>
          <p className="text-sm font-medium text-text-secondary mt-1">
            {subject}
          </p>
        </div>
        <Badge variant={config.variant} dot size="sm">
          {status === "review_24h" ? "Review" : status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3">
        {/* Mastery */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-1.5 rounded-full bg-surface-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                mastery >= 80
                  ? "bg-success"
                  : mastery >= 50
                    ? "bg-accent-amber"
                    : "bg-danger"
              }`}
              style={{ width: `${mastery}%` }}
            />
          </div>
          <span className="text-xs font-bold text-text-muted">{mastery}%</span>
        </div>

        {/* Mistakes */}
        {mistakeCount > 0 && (
          <span className="text-xs font-semibold text-danger flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {mistakeCount} mistakes
          </span>
        )}

        {/* Last tested */}
        {lastTested && (
          <span className="text-xs font-medium text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastTested}
          </span>
        )}
      </div>
    </button>
  );
}
