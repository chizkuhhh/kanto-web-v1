import { PrismaClient, Category, Channel, DeliveryMethod, OrderStatus } from "@prisma/client"

// Only the dev-phase2 branch host. The seed refuses to run anywhere else.
const DEV_HOST = "ep-nameless-heart-az7ty9p1"

if (!(process.env.DATABASE_URL ?? "").includes(DEV_HOST))
  throw new Error("Refusing to seed: DATABASE_URL is not the dev-phase2 branch.")

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.order.count()
  if (existing > 0) {
    console.log(`Skipped: ${existing} order(s) already exist. Reset the dev branch to seed again.`)
    return
  }

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Test Paddle",
        description: "Test product",
        category: Category.PADDLE,
        price: "2499.00",
        images: [],
        weightGrams: 350,
        variations: [{ type: "color", options: ["blue", "red"] }],
      },
    }),
    prisma.product.create({
      data: {
        name: "Test Cap",
        description: "Test product",
        category: Category.ACCESSORY,
        price: "699.00",
        images: [],
        weightGrams: 120,
        variations: [{ type: "style", options: ["text", "mascot"] }],
      },
    }),
    prisma.product.create({
      data: {
        name: "Test Jersey",
        description: "Test product",
        category: Category.ACTIVEWEAR,
        price: "1199.00",
        images: [],
        weightGrams: 200,
        variations: [],
      },
    }),
  ])

  const tomorrow = new Date(Date.now() + 24 * 3600_000)

  const seeds = [
    { product: products[0], quantity: 1, channel: Channel.MESSENGER, deliveryMethod: DeliveryMethod.JNT, status: OrderStatus.PENDING, shippingFee: "120.00", selectedVariations: { color: "blue" } },
    { product: products[1], quantity: 2, channel: Channel.INSTAGRAM, deliveryMethod: DeliveryMethod.JNT, status: OrderStatus.PAYMENT_CONFIRMED, shippingFee: "120.00", selectedVariations: { style: "mascot" } },
    { product: products[2], quantity: 1, channel: Channel.MANUAL, deliveryMethod: DeliveryMethod.LALAMOVE, status: OrderStatus.PAYMENT_CONFIRMED, shippingFee: "0.00", pickupAt: tomorrow },
    { product: products[0], quantity: 1, channel: Channel.WEB, deliveryMethod: DeliveryMethod.JNT, status: OrderStatus.BOOKED, shippingFee: "120.00", selectedVariations: { color: "red" } },
    { product: products[2], quantity: 3, channel: Channel.MESSENGER, deliveryMethod: DeliveryMethod.LALAMOVE, status: OrderStatus.DELIVERED, shippingFee: "0.00", pickupAt: tomorrow },
    { product: products[1], quantity: 1, channel: Channel.INSTAGRAM, deliveryMethod: DeliveryMethod.JNT, status: OrderStatus.CANCELLED, shippingFee: "120.00", selectedVariations: { style: "text" } },
  ]

  for (const s of seeds) {
    const price = Number(s.product.price)
    const productTotal = (price * s.quantity).toFixed(2)

    await prisma.order.create({
      data: {
        channel: s.channel,
        deliveryMethod: s.deliveryMethod,
        status: s.status,
        recipientName: "Test Customer",
        phone: "09171234567",
        address: "123 Test Street",
        city: "Bacoor",
        province: "Cavite",
        paymentMethod: "GCash",
        productTotal,
        shippingFee: s.shippingFee,
        pickupAt: s.pickupAt,
        items: {
          create: [{
            productId: s.product.id,
            productName: s.product.name,
            unitPrice: s.product.price!,
            quantity: s.quantity,
            selectedVariations: s.selectedVariations,
          }],
        },
        events: {
          create: [{ fromStatus: null, toStatus: s.status, note: "Seeded test order" }],
        },
      },
    })
  }

  console.log(`Seeded ${products.length} products and ${seeds.length} orders.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())