import Link from "next/link"

export const metadata = {
  title: "Privacy Policy | Kanto PH",
  description: "How Kanto PH collects, uses, and protects customer information.",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <article className="w-full max-w-2xl flex flex-col gap-6 text-sm leading-relaxed text-mine-shaft-700">
        <h1 className="text-2xl font-bold text-mine-shaft-900">Privacy Policy</h1>
        <p>Last updated: October 14, 2026</p>

        <p>
          Kanto PH (“we”, “us”) sells pickleball equipment and accessories. This policy explains
          what information we collect when you order from us, including through Messenger and
          Instagram direct messages, and how we use it.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Information we collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Your name, phone number, and delivery address</li>
            <li>The products, variations, and quantities you order</li>
            <li>Payment method and payment reference, if you provide one</li>
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
            We keep your name, phone number, address, and message history for three months after
            your order. After that, we remove these personal details. We keep order totals and
            product records for our bookkeeping, without your personal details.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Who we share it with</h2>
          <p>
            We share delivery details only with the courier handling your order (Lalamove or J&amp;T),
            and with Meta to send and receive messages. We do not share it with anyone else.
          </p>
        </section>

        <section id="data-deletion" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Your choices and data deletion</h2>
          <p>
            You can ask us to delete your personal information at any time by emailing{" "}
            <a href="mailto:YOUR-EMAIL@example.com" className="underline">YOUR-EMAIL@example.com</a>{" "}
            with the name and phone number you ordered with. We will delete it within 30 days, except
            for records we must keep for tax purposes, which we will keep without personal details.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-mine-shaft-900">Contact us</h2>
          <p>
            Kanto PH · YOUR REGISTERED BUSINESS NAME · YOUR BUSINESS ADDRESS ·{" "}
            <a href="mailto:YOUR-EMAIL@example.com" className="underline">YOUR-EMAIL@example.com</a>
          </p>
        </section>

        <p className="text-xs text-mine-shaft-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </article>
    </div>
  )
}