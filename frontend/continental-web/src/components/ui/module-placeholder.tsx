type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
        Continental
      </p>

      <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
        {title}
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-medium text-slate-500">
        Interfaz en construcción
      </div>
    </section>
  );
}