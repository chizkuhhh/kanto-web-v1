import { prisma } from "@/lib/prisma"
import { formatManilaDateTime } from "@/lib/format"
import { BIBLE_DEFAULT } from "@/lib/bibleDefault"
import { saveBibleAction, restoreBibleAction } from "./actions"

export const dynamic = "force-dynamic"

const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"
const button =
  "rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"

export default async function BiblePage() {
  const versions = await prisma.agentBibleVersion.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  })
  const current = versions[0]
  const text = current?.content ?? BIBLE_DEFAULT

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Chat assistant bible</h1>
          <p className="text-sm text-mine-shaft-600 mt-1">
            What the chat assistant knows about Kanto PH. Saved changes apply to new messages within about a
            minute.
            {current
              ? ` Last saved ${formatManilaDateTime(current.createdAt)}.`
              : " Showing the built-in starting content."}
          </p>
        </div>

        <form
          action={saveBibleAction}
          className="flex flex-col gap-4 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"
        >
          <textarea name="content" rows={28} defaultValue={text} className={input} />
          <div>
            <button type="submit" className={button}>
              Save bible
            </button>
          </div>
        </form>

        {versions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5">
            <h2 className="text-lg font-bold">Saved versions</h2>
            <ul className="flex flex-col gap-2">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-4 text-sm">
                  <span>{formatManilaDateTime(v.createdAt)}</span>
                  <form action={restoreBibleAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="text-sm underline">
                      Restore this version
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}