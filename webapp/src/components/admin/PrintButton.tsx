"use client";

import { MaterialIcon } from "@/components/MaterialIcon";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-5 py-2.5 font-label-md text-label-md hover:opacity-90 transition-opacity"
    >
      <MaterialIcon name="print" className="text-lg" />
      Хэвлэх
    </button>
  );
}
