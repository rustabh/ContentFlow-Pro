"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <path d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M15 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/planner",
    label: "Planner",
    icon: (
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/shoots",
    label: "Shoot Planner",
    icon: (
      <path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/ideas",
    label: "Content Ideas",
    icon: (
      <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0012 2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/queue",
    label: "Scheduling Queue",
    icon: (
      <path d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <path d="M3 3v18h18M8 17V9m5 8V5m5 12v-6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/exports",
    label: "Exports",
    icon: (
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="no-print sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-gray-100 bg-white lg:w-60">
      <div className="flex h-16 items-center border-b border-gray-100 px-4">
        <div className="hidden lg:block">
          <Logo />
        </div>
        <div className="lg:hidden">
          <Logo compact />
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="shrink-0"
              >
                {item.icon}
              </svg>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-gray-100 p-4 text-[11px] leading-relaxed text-gray-400 lg:block">
        Designed by{" "}
        <span className="font-semibold text-primary-500">Incinc Media</span>
      </div>
    </aside>
  );
}
