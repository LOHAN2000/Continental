"use client";

import { usePathname } from "next/navigation";

import { navigationItems } from "@/lib/constants/navigation";

import type { SessionUser } from "@/types/auth";

type TopbarProps = {
  user: SessionUser;
  onOpenMenu: () => void;
};

export function Topbar({
  user,
  onOpenMenu,
}: TopbarProps) {
  const pathname = usePathname();

  const activeItem = navigationItems.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menú"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-red-100 lg:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d90016]">
              Continental
            </p>

            <h1 className="truncate text-xl font-bold text-[#24272a] sm:text-2xl">
              {activeItem?.label ?? "Panel administrativo"}
            </h1>
          </div>
        </div>

        <div className="hidden text-right sm:block">
          <p className="max-w-56 truncate text-sm font-semibold text-slate-800">
            {user.nombres}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {user.rol}
          </p>
        </div>
      </div>
    </header>
  );
}