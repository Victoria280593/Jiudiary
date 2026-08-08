"use client";

import { useEffect, useState } from "react";
import { Belt } from "@/components/Belt";
import type { Belt as BeltType } from "@prisma/client";

const BELT_UPDATED_EVENT = "jiudiary:belt-updated";

type BeltUpdatedDetail = {
  belt: BeltType | null;
};

export function notifyBeltUpdated(belt: BeltType | null) {
  window.dispatchEvent(
    new CustomEvent<BeltUpdatedDetail>(BELT_UPDATED_EVENT, {
      detail: { belt },
    })
  );
}

export function useLiveBelt(initialBelt: BeltType | null) {
  const [beltState, setBeltState] = useState(initialBelt);

  useEffect(() => {
    function handleBeltUpdated(event: Event) {
      const { belt } = (event as CustomEvent<BeltUpdatedDetail>).detail;
      setBeltState(belt);
    }

    window.addEventListener(BELT_UPDATED_EVENT, handleBeltUpdated);
    return () => window.removeEventListener(BELT_UPDATED_EVENT, handleBeltUpdated);
  }, []);

  return beltState;
}

export function LiveBelt({
  belt,
  size,
  className,
}: {
  belt: BeltType;
  size: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const liveBelt = useLiveBelt(belt);

  return (
    <Belt
      belt={liveBelt ?? belt}
      size={size}
      className={`${size === "xs" ? "h-8 w-14" : "h-12 w-24"} ${className ?? ""}`}
    />
  );
}
