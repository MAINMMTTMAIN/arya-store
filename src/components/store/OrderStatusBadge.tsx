import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, statusTone, type OrderStatus } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<ReturnType<typeof statusTone>, string> = {
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASS[statusTone(status)], className)}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
