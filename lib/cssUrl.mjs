export function toCssUrl(value) {
  const url = typeof value === "string" ? value : "";
  return `url(${JSON.stringify(url)})`;
}
