export function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

export function formatAC(value) {
  return `${Number(value).toLocaleString("en-US")} AC`;
}
