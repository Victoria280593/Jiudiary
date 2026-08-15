"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function UserMenu({ children }: { children: ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    };

    document.addEventListener("pointerdown", closeMenu);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
    };
  }, []);

  return (
    <details
      ref={menuRef}
      className="user-menu"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button")) {
          menuRef.current?.removeAttribute("open");
        }
      }}
    >
      {children}
    </details>
  );
}
