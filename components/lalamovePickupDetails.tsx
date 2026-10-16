import Image from "next/image"
import { LALAMOVE_PICKUP } from "@/lib/paymentInstructions"

export default function LalamovePickupDetails() {
  return (
    <div className="flex flex-col gap-3 text-sm">
       <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-mine-shaft-500">Name</dt>
        <dd className="font-semibold">{LALAMOVE_PICKUP.name}</dd>
        <dt className="text-mine-shaft-500">Contact no.</dt>
        <dd className="font-semibold">{LALAMOVE_PICKUP.phone}</dd>
        <dt className="text-mine-shaft-500">Address</dt>
        <dd>{LALAMOVE_PICKUP.address}</dd>
        <dt className="text-mine-shaft-500">Landmark</dt>
        <dd>{LALAMOVE_PICKUP.landmark}</dd>
      </dl>
      <div>
        <p className="mb-2">Set the pin on the Lalamove map to this spot:</p>
        <Image
          src={LALAMOVE_PICKUP.pinImage}
          alt="Map pin for the Kanto PH pickup point"
          width={800}
          height={600}
          className="h-auto w-full rounded-lg border border-black-haze-300"
        />
      </div>
    </div>
  )
}