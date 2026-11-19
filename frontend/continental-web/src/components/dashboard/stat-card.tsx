type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  tone?: "red" | "yellow" | "green" | "dark";
};

const toneStyles = {
  red: {
    border: "border-l-[#d90016]",
    badge: "bg-red-50 text-[#a90012]",
  },
  yellow: {
    border: "border-l-[#f7b500]",
    badge: "bg-amber-50 text-amber-800",
  },
  green: {
    border: "border-l-[#147522]",
    badge: "bg-green-50 text-green-800",
  },
  dark: {
    border: "border-l-[#24272a]",
    badge: "bg-slate-100 text-slate-700",
  },
};

export function StatCard({
  label,
  value,
  description,
  tone = "dark",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <article
      className={[
        "rounded-2xl border border-slate-200",
        "border-l-4 bg-white p-5 shadow-sm",
        styles.border,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black text-[#24272a]">
            {value}
          </p>
        </div>

        <span
          aria-hidden="true"
          className={[
            "h-3 w-3 rounded-full",
            styles.badge,
          ].join(" ")}
        />
      </div>

      {description && (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}