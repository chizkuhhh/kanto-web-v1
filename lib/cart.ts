export type CartItem = {
  productId: string
  quantity: number
  variations: Record<string, string>
}

const KEY = "kanto-cart"
const MAX_QTY = 50
const listeners = new Set<() => void>()

export const optionsKey = (v: Record<string, string>) =>
  Object.keys(v).sort().map((k) => `${k}=${v[k]}`).join("|")

// The snapshot is the raw string. Strings compare by value, so React doesn't loop.
export function getCartSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]"
  } catch {
    return "[]"
  }
}

// Used during server rendering and hydration, before the browser's cart is read
export function getCartServerSnapshot(): string {
  return "[]"
}

// Re-renders subscribers when this tab writes the cart, or when another tab does
export function subscribeCart(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener("storage", onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function parseCart(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage is blocked (private window, for example). The cart just won't persist.
  }
  listeners.forEach((l) => l())
}

// Same product with the same options adds to the existing line
export function addToCart(item: CartItem) {
  const cart = parseCart(getCartSnapshot())
  const i = cart.findIndex(
    (c) => c.productId === item.productId && optionsKey(c.variations) === optionsKey(item.variations),
  )
  if (i >= 0) cart[i].quantity = Math.min(MAX_QTY, cart[i].quantity + item.quantity)
  else cart.push({ ...item, quantity: Math.min(MAX_QTY, item.quantity) })
  writeCart(cart)
}