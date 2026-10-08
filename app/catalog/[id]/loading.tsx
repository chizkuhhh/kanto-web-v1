import { Spinner } from "@/components/ui/spinner"

export default function ProductLoading() {
    return (
        <>
            <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
                <div className="w-full max-w-2xl">
                    <div className="flex mb-8 w-full justify-between">
                        <div className="h-9 w-24 rounded-full bg-black-haze-200 animate-pulse" />
                        <div className="h-5 w-40 rounded bg-black-haze-200 animate-pulse" />
                    </div>

                    <div className="w-full aspect-square rounded-xl bg-black-haze-200 animate-pulse" />

                    <div className="h-8 w-2/3 rounded bg-black-haze-200 animate-pulse mt-6" />
                    <div className="h-5 w-24 rounded bg-black-haze-200 animate-pulse mt-2" />

                    <div className="flex flex-col gap-2 mt-3">
                        <div className="h-4 w-full rounded bg-black-haze-200 animate-pulse" />
                        <div className="h-4 w-5/6 rounded bg-black-haze-200 animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-black-haze-200 animate-pulse" />
                    </div>

                    <div className="flex flex-col gap-3 mt-6 items-center">
                        <div className="h-12 w-56 rounded-full bg-black-haze-200 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black-haze-100/60 backdrop-blur-sm">
                <Spinner className="size-10 text-mine-shaft-700" />
            </div>
        </>
    )
}