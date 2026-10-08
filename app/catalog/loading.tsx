export default function CatalogLoading() {
    return (
        <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
            <div className="flex mb-8 w-full justify-between">
                <div className="h-9 w-24 rounded-full bg-black-haze-200 animate-pulse" />
                <div className="h-5 w-40 rounded bg-black-haze-200 animate-pulse" />
            </div>

            <div className="w-full max-w-5xl flex items-center justify-between mb-6">
                <div className="h-8 w-32 rounded bg-black-haze-200 animate-pulse" />
                <div className="h-9 w-32 rounded-full bg-black-haze-200 animate-pulse" />
            </div>

            <div className="h-10 w-full max-w-5xl rounded-full bg-black-haze-200 animate-pulse" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 w-full max-w-5xl">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <div className="aspect-square w-full rounded-xl bg-black-haze-200 animate-pulse" />
                        <div className="h-4 w-3/4 rounded bg-black-haze-200 animate-pulse" />
                        <div className="h-4 w-1/3 rounded bg-black-haze-200 animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
}