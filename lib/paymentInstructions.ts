// Shown on the order page while payment is pending
export const PAYMENT_INSTRUCTIONS: Record<string, string[]> = {
  "BDO bank transfer": ["Bank: BDO", "Account number: 002400288131", "Account name: Karenina Capio"],
  "Security Bank transfer": ["Bank: Security Bank", "Account number: 0000075199007", "Account name: Karenina Capio"],
  GCash: ["GCash number: 09175259839", "Account name: Karenina Capio"],
  Maya: ["Maya number: 09175259839", "Account name: Karenina Capio"],
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