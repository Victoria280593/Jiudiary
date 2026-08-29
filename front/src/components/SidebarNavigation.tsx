"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v14H4V6a1 1 0 011-1z" />
      <path strokeLinecap="round" d="M8 13h2m4 0h2m-8 4h2m4 0h2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20v-1.5A3.5 3.5 0 0012.5 15h-5A3.5 3.5 0 004 18.5V20m13-9a3 3 0 110-6 3 3 0 010 6zM10 11a3 3 0 110-6 3 3 0 010 6zm8.5 4.5A3.5 3.5 0 0122 19" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
    </svg>
  );
}

export function TopNavigation({ role }: { role: Role }) {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLElement>(null);

  const profileIsActive = pathname.startsWith("/dashboard/profile");
  const analyticsIsActive = pathname.startsWith("/dashboard/analytics");
  const peopleSectionIsActive = role === "STUDENT"
    ? pathname.startsWith("/dashboard/student/coach")
    : role === "COACH" && pathname.startsWith("/students");
  const calendarIsActive = !profileIsActive && !peopleSectionIsActive && !analyticsIsActive;

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    let animationFrame = 0;
    const updateActiveIndicator = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const activeItem = navigation.querySelector<HTMLElement>('[data-active="true"]');
        if (!activeItem) return;

        navigation.style.setProperty("--indicator-x", `${activeItem.offsetLeft}px`);
        navigation.style.setProperty("--indicator-width", `${activeItem.offsetWidth}px`);
        navigation.classList.add("is-ready");
      });
    };

    updateActiveIndicator();
    const resizeObserver = new ResizeObserver(updateActiveIndicator);
    resizeObserver.observe(navigation);
    window.addEventListener("orientationchange", updateActiveIndicator);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", updateActiveIndicator);
    };
  }, [pathname, role]);

  return (
    <nav ref={navigationRef} aria-label="Основная навигация" className="top-navigation">
      <span className="nav-active-indicator" aria-hidden="true" />
      <Link href="/dashboard/profile" data-active={profileIsActive} aria-current={profileIsActive ? "page" : undefined} className="nav-item">
        <ProfileIcon />
        <span className="nav-profile-label"><span className="nav-profile-prefix">Мой </span>профиль</span>
      </Link>
      <Link href="/" data-active={calendarIsActive} aria-current={calendarIsActive ? "page" : undefined} className="nav-item">
        <CalendarIcon />
        <span>Календарь</span>
      </Link>
      {role !== "ADMIN" && (
        <Link href="/dashboard/analytics" data-active={analyticsIsActive} aria-current={analyticsIsActive ? "page" : undefined} className="nav-item">
          <AnalyticsIcon />
          <span>Аналитика</span>
        </Link>
      )}
      {role === "STUDENT" ? (
        <Link href="/dashboard/student/coach" data-active={peopleSectionIsActive} aria-current={peopleSectionIsActive ? "page" : undefined} className="nav-item">
          <ProfileIcon />
          <span>Тренер</span>
        </Link>
      ) : role === "COACH" ? (
        <Link href="/students" data-active={peopleSectionIsActive} aria-current={peopleSectionIsActive ? "page" : undefined} className="nav-item">
          <UsersIcon />
          <span>Ученики</span>
        </Link>
      ) : (
        <span className="nav-item nav-item-disabled" data-active="false" aria-disabled="true">
          <UsersIcon />
          <span>Ученики</span>
        </span>
      )}
    </nav>
  );
}
