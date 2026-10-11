export function formatVariantLabel(options: unknown) {
  if (!options || typeof options !== "object") return "Standard"
  const entries = Object.entries(options as Record<string, string>)
  if (entries.length === 0) return "Standard"
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ")
}