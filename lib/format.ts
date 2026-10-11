const pesos = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })

export const formatPeso = (value: number) => pesos.format(value)

export const formatManilaDateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)

export const formatOrderNumber = (n: number) => `KT-${n}`