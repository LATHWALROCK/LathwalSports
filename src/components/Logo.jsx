import React, { useState } from "react";
import { initials, sizedUrl } from "../utils/helpers";

const SIZES_PX = {
  xs: 48,
  sm: 64,
  md: 96,
  lg: 144,
  xl: 220,
  xxl: 300,
};

export default function Logo({
  url,
  label = "",
  short = "",
  color = "#334155",
  size = "md",
  className = "",
  title = "",
}) {
  const [failed, setFailed] = useState(!url);
  const px = SIZES_PX[size] || 96;
  const displayShort = short || initials(label);
  const tooltip = title || label;

  return (
    <span
      className={`logo ${size} ${failed ? "fail" : ""} ${className}`}
      style={{ "--c": color }}
      title={tooltip}
    >
      {url && !failed ? (
        <img
          src={sizedUrl(url, px)}
          alt={`${label} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <b className="logo-fallback">{displayShort}</b>
      )}
    </span>
  );
}
