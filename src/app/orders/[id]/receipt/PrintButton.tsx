"use client";

import { useEffect } from "react";

/** Opens the browser's print dialog automatically (defaults to the OS's
 * standard printer) once the receipt has rendered, plus a manual button as
 * a fallback/reprint - some browsers block the automatic dialog. */
export function PrintButton() {
  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="mb-4 flex justify-center print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        🖨 Drucken
      </button>
    </div>
  );
}
