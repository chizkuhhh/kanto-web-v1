import { SiFacebook, SiInstagram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/backButton";

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="mb-6 self-start">
        <BackButton />
      </div>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-mine-shaft-900 mb-2 text-center">
          Contact Us
        </h1>
        <p className="text-sm text-mine-shaft-600 text-center mb-8">
          Message us to order directly.
        </p>

        <div className="flex flex-col gap-3 w-auto text-md items-center">
          <Button
            className="rounded-full h-12 bg-mine-shaft-800 hover:bg-mine-shaft-900 px-4 w-full max-w-xs"
          >
            <a href="https://www.facebook.com/KantoSportsPHL" target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center justify-center">
              <SiFacebook className="text-[#1877F2]"/>
              <p>Message us on <span className="font-bold">Facebook</span></p>
            </a>
          </Button>

          <Button
            variant="outline"
            className="rounded-full h-12 border-mine-shaft-800 bg-black-haze-100 px-4 w-full max-w-xs"
          >
            <a href="https://www.instagram.com/kantophl?igsi=MWx4Y2tuNmVkOXRncw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center justify-center">
              <SiInstagram className="text-[#E4405F]"/>
              <p>Message us on <span className="font-bold">Instagram</span></p>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}