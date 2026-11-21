"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "./logout-button";

import { navigationItems } from "@/lib/constants/navigation";

import type { SessionUser } from "@/types/auth";

type SidebarProps = {
  user: SessionUser;
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({
  user,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(user.rol)
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50",
          "flex w-[280px] flex-col",
          "border-r border-slate-200 bg-white",
          "transition-transform duration-200",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-24 items-center justify-between border-b border-slate-200 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <Image
              src="/brand/logo-continental.png"
              alt="Logo de Continental"
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-contain"
              priority
            />
            <span className="font-bold text-xl text-[#24272a]">Continental</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
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
                d="M6 6l12 12M18 6L6 18"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <p className="truncate text-sm font-bold text-[#24272a]">
            {user.nombres}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {user.correo}
          </p>

          <span className="mt-3 inline-flex rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-bold text-[#6b4e00]">
            {user.rol}
          </span>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "flex items-center gap-3",
                      "rounded-xl px-3 py-2.5",
                      "text-sm font-semibold transition",
                      "focus:outline-none focus:ring-4 focus:ring-red-100",
                      isActive
                        ? "bg-[#d90016] text-white shadow-sm"
                        : "text-slate-800 hover:bg-red-50 hover:text-[#a90012]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center",
                        "rounded-lg text-[11px] font-black",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {item.shortLabel}
                    </span>

                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}