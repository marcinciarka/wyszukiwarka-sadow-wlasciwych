"use client";

import dynamic from "next/dynamic";

export const CourtSearchWrapper = dynamic(
  () => import("./CourtSearch").then((mod) => mod.CourtSearch),
  {
    ssr: false,
  }
);
