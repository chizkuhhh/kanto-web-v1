// Shown on the order page while payment is pending
export const PAYMENT_INSTRUCTIONS: Record<string, string> = {
  GCash: "Send payment to GCash [number] under the name [name]. Put your order number in the reference.",
  "Bank transfer": "Transfer to [bank] account [number] under [name]. Put your order number in the reference.",
}

export const CONTACT_NOTE =
  "Questions? Message us on [Messenger / Instagram] and include your order number."

// Where the customer's Lalamove rider picks up the order. Fill this in before launch.
// Shown to Lalamove customers so they can set the pickup point. Fill in before launch.
export const LALAMOVE_PICKUP = {
  address: "33 Turin St. BF Homes International, Las Piñas City, Metro Manila",
  name: "Cheska Capio",
  phone: "09175363628",
  landmark: "\"near Mama Lou's Italian Kitchen, in between houses 847 & 849\"",
  pinImage: "/lalamove-pin.jpeg",
}