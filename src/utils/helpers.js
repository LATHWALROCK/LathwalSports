// Common formatting, sorting and logo helper utilities

export const initials = (name) => {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
};

export const startYear = (season) => {
  const m = String(season || "").match(/\d{4}/);
  return m ? +m[0] : 0;
};

export const endYear = (season) => {
  const m = String(season || "").match(/(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/);
  if (!m) return 0;
  if (!m[2]) return +m[1];
  return m[2].length === 4 ? +m[2] : +(m[1].slice(0, 2) + m[2]);
};

export const sizedUrl = (url, px) => {
  if (!url) return "";
  if (/Special:FilePath/.test(url)) {
    return /[?&]width=\d+/.test(url)
      ? url.replace(/([?&])width=\d+/, `$1width=${px}`)
      : url + (url.includes("?") ? "&" : "?") + "width=" + px;
  }
  if (/static\.wikia\.nocookie\.net/.test(url)) {
    return url.replace(/\/revision\/latest.*$/, `/revision/latest/scale-to-width-down/${px}`);
  }
  return url;
};

// Convert File to base64 Data URL for instant live preview
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
