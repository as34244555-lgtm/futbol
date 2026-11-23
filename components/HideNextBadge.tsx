"use client";

import { useEffect } from "react";

/** Force-hide the Next.js floating "N" mark (often lives in a shadow root). */
export function HideNextBadge() {
  useEffect(() => {
    const hide = () => {
      document.querySelectorAll("nextjs-portal").forEach((portal) => {
        const root = portal.shadowRoot ?? portal;
        root.querySelectorAll<HTMLElement>("#next-logo, [data-next-mark], [data-next-badge]").forEach((el) => {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.setAttribute("aria-hidden", "true");
        });
      });
    };
    hide();
    const obs = new MutationObserver(hide);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const t = window.setInterval(hide, 1000);
    return () => {
      obs.disconnect();
      window.clearInterval(t);
    };
  }, []);
  return null;
}
