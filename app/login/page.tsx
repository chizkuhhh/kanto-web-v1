import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google", { redirectTo: "/admin/orders" })
      }}
      className="flex flex-col items-center gap-4 pt-40"
    >
      <Button type="submit">Sign in with Google</Button>
    </form>
  )
}