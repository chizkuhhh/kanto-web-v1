import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SiShopee, SiTiktok } from "react-icons/si";

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

      {/* buttons */}
      <div className="flex flex-col gap-3 mt-6 w-auto text-md items-center">
        <Button className="rounded-full h-12 bg-mine-shaft-800 hover:bg-mine-shaft-900 px-4">
          <a href="https://shopee.ph/kanto_ph" target="_blank" rel="noopener noreferrer" className="flex gap-2">
            <SiShopee className="text-orange-500" />
            <p>Shop on <span className="font-bold">Shopee</span></p>
          </a>
        </Button>
        <Button variant="outline" className="rounded-full h-12 border-mine-shaft-800 bg-black-haze-100 px-4">
          <a href="https://vt.tiktok.com/ZSVuDekwW/?page=TikTokShop" target="_blank" rel="noopener noreferrer" className="flex gap-2">
            <SiTiktok />
            <p>Shop on <span className="font-bold">Tiktok</span></p>
          </a>
        </Button>
      </div>
    </div>
  );
}
