"use client";

import { useEffect, useState } from "react";
import { Belt } from "@/components/Belt";
import type { Belt as BeltType } from "@prisma/client";

const BELT_UPDATED_EVENT = "jiudiary:belt-updated";

type BeltUpdatedDetail = {
  belt: BeltType;
  stripes: number;
};

export function notifyBeltUpdated(belt: BeltType, stripes: number) {
  window.dispatchEvent(
    new CustomEvent<BeltUpdatedDetail>(BELT_UPDATED_EVENT, {
      detail: { belt, stripes },
    })
  );
}

export function useLiveBelt(initialBelt: BeltType | null, initialStripes: number) {
  const [beltState, setBeltState] = useState({
    belt: initialBelt,
    stripes: initialStripes,
  });

  useEffect(() => {
    function handleBeltUpdated(event: Event) {
      const { belt, stripes } = (event as CustomEvent<BeltUpdatedDetail>).detail;
      setBeltState({ belt, stripes });
    }

    window.addEventListener(BELT_UPDATED_EVENT, handleBeltUpdated);
    return () => window.removeEventListener(BELT_UPDATED_EVENT, handleBeltUpdated);
  }, []);

  return beltState;
}

export function LiveBelt({
  belt,
  stripes,
  size,
  className,
}: {
  belt: BeltType;
  stripes: number;
  size: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const liveBelt = useLiveBelt(belt, stripes);

  return (
    <Belt
      belt={liveBelt.belt ?? belt}
      stripes={liveBelt.stripes}
      size={size}
      className={className}
    />
  );
}
