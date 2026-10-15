"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

export function ActiveNav({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const isActive =
          item.href === "/protected"
            ? pathname === "/protected"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-xl px-4 py-3 text-left transition-all duration-200 ${
              isActive
                ? "bg-[#315C4B] text-white shadow-sm"
                : "text-[#17372C] hover:bg-[#F3EEE2] hover:text-[#315C4B]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}