"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Link that marks itself as the current page (aria-current + `activeClassName`). */
export function NavLink({
  href,
  className,
  activeClassName = "",
  children,
}: {
  href: string;
  className: string;
  activeClassName?: string;
  children: ReactNode;
}) {
  const active = usePathname() === href;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${className} ${active ? activeClassName : ""}`}>
      {children}
    </Link>
  );
}
