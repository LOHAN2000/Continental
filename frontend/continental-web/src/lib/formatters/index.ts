export function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

export function formatDateTime(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Lima",
    }
  ).format(new Date(value));
}

export function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}