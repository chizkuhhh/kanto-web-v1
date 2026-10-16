import Link from "next/link"

// Fill these in once. They appear on the page in several places.
const BUSINESS_NAME = "KANTO-PH SPORTS EQUIPMENT & ACCESSORIES SHOP"
const BUSINESS_ADDRESS = "33 TURIN ST. B.F. INTERNATIONAL VILLAGE 1740 CITY OF LAS PIÑAS NCR, FOURTH"
const CONTACT_EMAIL = "mail.kantoph@gmail.com"
const LAST_UPDATED = "October 15, 2026"

export const metadata = {
  title: "Privacy Policy | Kanto PH",
  description: "How Kanto PH collects, uses, and protects customer information.",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <article className="w-full max-w-2xl flex flex-col gap-6 text-sm leading-relaxed text-mine-shaft-700">
        <h1 className="text-2xl font-bold text-mine-shaft-900">Privacy Policy</h1>
        <p>Last updated: {LAST_UPDATED}</p>

        <p>
          Kanto PH (“we”, “us”) sells pickleball equipment and accessories. This policy explains
          what information we collect when you order from us, whether on our website, through
          Messenger or Instagram, or in person, and how we use it.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Information we collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Your name, phone number, and delivery address</li>
            <li>The products, variations, and quantities you order</li>
            <li>Your chosen delivery method, and the pickup time if you choose Lalamove</li>
            <li>The time you accepted our Lalamove booking note, if you chose Lalamove</li>
            <li>Payment method, and payment reference if you provide one</li>
            <li>Any notes you add to your order</li>
            <li>Messages you send to our Messenger page or Instagram account while placing an order</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">How we use it</h2>
          <p>
            We use this information only to answer your questions, take and fulfill your order,
            arrange delivery, confirm payment, and contact you about your order. We do not sell
            your information, and we do not use it for advertising.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Order tracking links</h2>
          <p>
            After you place an order on our website, you get a private link to see its status and
            details. Anyone with that link can see your order, so please keep it to yourself. If you
            lose it, contact us with your order number.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Messenger and Instagram</h2>
          <p>
            When you message us on Messenger or Instagram, Meta passes us your messages and your
            account identifier so we can reply. We only read and reply to messages sent to our own
            page and account. A team member may take over a conversation to help you directly.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">How long we keep it</h2>
          <p>
            We keep your name, phone number, address, notes, and message history for three months
            after your order. After that, we remove these personal details, and tracking links for
            those orders stop working. We keep order totals and product records for our bookkeeping,
            without your personal details.
          </p>
          <p>
            Orders that are not paid within 24 hours are cancelled automatically, and the items go
            back into stock.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Who we share it with</h2>
          <p>We share information only with the following, and only as needed for your order:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Lalamove or J&amp;T, for delivery. For Lalamove, you book and pay directly in the Lalamove app.</li>
            <li>Meta, to send and receive Messenger and Instagram messages.</li>
            <li>Cloudflare, which runs a security check on our order form to block automated orders.</li>
            <li>Our website hosting and database providers, which store and process the information above.</li>
          </ul>
          <p>
            Our internal alerts for new orders (sent to our team on Telegram) include the order
            number, sales channel, delivery method, and total. They don&apos;t include your name,
            phone number, or address.
          </p>
          <p>We do not share your information with anyone else.</p>
        </section>

        <section id="data-deletion" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Your choices and data deletion</h2>
          <p>
            You can ask us to delete your personal information at any time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>{" "}
            with the name and phone number you ordered with. We will delete it within 30 days, except
            for records we must keep for tax purposes, which we will keep without personal details.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Contact us</h2>
          <p>
            {BUSINESS_NAME} · {BUSINESS_ADDRESS} ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

        <p className="text-xs text-mine-shaft-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </article>
    </div>
  )
}