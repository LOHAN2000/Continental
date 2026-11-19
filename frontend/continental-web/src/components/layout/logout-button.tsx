"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  compact?: boolean;
};

export function LogoutButton({
  compact = false,
}: LogoutButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Cerrar sesión"
      className={[
        "flex items-center justify-center gap-2 rounded-xl",
        "border border-red-200 bg-red-50 font-semibold",
        "text-[#a90012] transition",
        "hover:border-red-300 hover:bg-red-100",
        "focus:outline-none focus:ring-4 focus:ring-red-100",
        "disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "h-10 w-10" : "w-full px-4 py-3",
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M10 17l5-5-5-5M15 12H3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!compact && (
        <span>
          {isLoading ? "Cerrando…" : "Cerrar sesión"}
        </span>
      )}
    </button>
  );
}