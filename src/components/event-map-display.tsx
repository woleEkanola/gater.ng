"use client";

import dynamic from "next/dynamic";

const MapDisplay = dynamic(
  () => import("@/components/map-display").then((mod) => mod.MapDisplay),
  { ssr: false }
);

interface EventMapDisplayProps {
  location: string;
  latitude: number;
  longitude: number;
  height?: number;
}

export function EventMapDisplay(props: EventMapDisplayProps) {
  return <MapDisplay {...props} />;
}
