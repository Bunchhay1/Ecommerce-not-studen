export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatOrderStatus(status: string): { label: string; color: string; bg: string } {
  switch (status?.toUpperCase()) {
    case "PENDING":
    case "PLACED":
      return { label: "Placed", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" };
    case "PAID":
    case "CONFIRMED":
      return { label: "Paid", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" };
    case "PROCESSING":
      return { label: "Processing", color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" };
    case "SHIPPED":
    case "IN_TRANSIT":
      return { label: "Shipped", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" };
    case "OUT_FOR_DELIVERY":
      return { label: "Out for Delivery", color: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/20" };
    case "DELIVERED":
    case "COMPLETED":
      return { label: "Delivered", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" };
    case "CANCELLED":
      return { label: "Cancelled", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" };
    case "REFUNDED":
      return { label: "Refunded", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" };
    default:
      return { label: status || "Unknown", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" };
  }
}
