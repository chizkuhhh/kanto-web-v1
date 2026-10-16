// clears personal details from orders older than 3 months from their order date, keeps the amounts, and removes customer records that no longer have orders.

import { prisma } from "@/lib/prisma"
import { deleteProof } from "@/lib/paymentProofs"

export async function purgeOldCustomerDetails() {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 3)

  // Delete payment screenshots for old orders. If a delete fails, the key stays and the next run retries.
  const oldProofs = await prisma.order.findMany({
    where: { createdAt: { lt: cutoff }, paymentProofKey: { not: null } },
    select: { id: true, paymentProofKey: true },
  })
  for (const o of oldProofs) {
    try {
      await deleteProof(o.paymentProofKey!)
      await prisma.order.update({ where: { id: o.id }, data: { paymentProofKey: null } })
    } catch (err) {
      console.error("Proof delete failed:", o.id, err)
    }
  }

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
      publicToken: null,
      lalamoveLink: null,
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