import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black-haze-100 px-5 py-4 md:px-8 md:py-6">
      {/* main image */}
      <Image
        src="/kanto-sports-filled.png"
        alt="Kanto PH"
        width={400}
        height={400}
        priority
        className="w-full max-w-md md:max-w-lg drop-shadow-xs drop-shadow-black-haze-400"
      />

      {/* text */}
      <p className="w-full max-w-xs md:max-w-md text-sm text-center">
        Familiar <span className="font-bold italic">Filipino</span> classics, re-imagined into thoughtfully designed gear. Made with personality, built to <span className="font-bold">perform</span>.
      </p>

      {/* button */}
      <div className="flex flex-col gap-3 mt-6 w-auto text-md items-center">
        <Link
          href="/catalog"
          className="inline-flex items-center rounded-full h-12 px-6 bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"
        >
          Shop now
        </Link>
      </div>
    </div>
  );
}