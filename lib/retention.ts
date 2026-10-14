// clears personal details from orders older than 3 months from their order date, keeps the amounts, and removes customer records that no longer have orders.

import { prisma } from "@/lib/prisma"

export async function purgeOldCustomerDetails() {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 3)

  // Clear personal details but keep items, totals, and status for bookkeeping.
  // Only touches orders that haven't been purged yet, so reruns are safe.
  const { count } = await prisma.order.updateMany({
    where: { createdAt: { lt: cutoff }, personalDataPurgedAt: null },
    data: {
      recipientName: "[purged]",
      phone: "[purged]",
      address: "[purged]",
      city: "[purged]",
      province: "[purged]",
      postalCode: null,
      notes: null,
      customerId: null,
      personalDataPurgedAt: new Date(),
    },
  })

  // Runs after the orders update, so customers who lost their last order are removed too
  await prisma.customer.deleteMany({
    where: { createdAt: { lt: cutoff }, orders: { none: {} } },
  })

  await prisma.conversation.deleteMany({ where: { lastMessageAt: { lt: cutoff } } })

  return count
}