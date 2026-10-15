let printing = false;

/** Opens the browser's print dialog; choose Save as PDF. Requires a mounted PrintRoot. */
export function downloadPdf(title: string): void {
  if (typeof window === "undefined" || printing) return;
  if (!document.querySelector("#print-root > article")) {
    throw new Error("Mount PrintRoot with the resume data before printing.");
  }

  const originalTitle = document.title;
  printing = true;
  const restore = () => {
    document.title = originalTitle;
    printing = false;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore, { once: true });
  document.title = title.trim() || "Resume";
  try {
    window.print();
  } catch (error) {
    restore();
    throw error;
  }
}
