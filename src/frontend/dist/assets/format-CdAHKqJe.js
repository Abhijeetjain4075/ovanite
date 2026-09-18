function timestampToDate(timestamp) {
  const date = new Date(Number(timestamp / 1000000n));
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(timestamp) {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}
function formatDateTime(timestamp) {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
function sectionIndex(index) {
  return String(index).padStart(2, "0");
}
function hasProductImage(image) {
  if (!image) return false;
  const bytes = image._blob;
  return bytes !== void 0 && bytes !== null && bytes.byteLength > 0;
}
export {
  formatDate as a,
  formatDateTime as f,
  hasProductImage as h,
  sectionIndex as s
};
