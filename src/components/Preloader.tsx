/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 */

"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock scroll during preloader display
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Begin fade-out at 3.3s so it finishes smoothly at 4.0s
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 3300);

    // Fully hide & restore scroll at 4.0s
    const hideTimer = setTimeout(() => {
      setHidden(true);
      document.body.style.overflow = prevOverflow;
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted || hidden) return null;

  return (
    <aside
      className={`site-preloader ${fading ? "preloader-fading" : ""}`}
      aria-label="WAMARK Nigeria Limited"
      aria-live="polite"
      role="status"
    >
      <div className="preloader-container">
        {/* Floating Logo on pure white background (reduced by half) */}
        <div className="preloader-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/wamark-logo.webp"
            alt="WAMARK Nigeria Limited"
            className="preloader-logo"
            width={130}
            height={34}
          />
        </div>

        {/* Dynamic Expanding/Reducing Floor Shadow */}
        <div className="preloader-shadow-wrap">
          <div className="preloader-shadow" />
        </div>
      </div>
    </aside>
  );
}
