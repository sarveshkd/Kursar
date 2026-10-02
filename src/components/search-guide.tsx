import { SEARCH_ANSWERS } from "@/lib/search-copy"

export function SearchGuide() {
  return (
    <section id="how-scoring-works" className="border-t border-[#1a1714] bg-[#f7f3ea]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="font-display text-3xl tracking-tight text-[#1a1714]">What this free resume checker scores</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3f3a33]">
          Resume Scorer reads the words in a PDF, DOCX, or text file and scores five parts of that page. The notes quote lines from your file. The upload is not saved, and the checker does not compare you with a job posting.
        </p>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {SEARCH_ANSWERS.map((item) => (
            <div key={item.question} className="border border-[#d9d0c0] bg-[#fbf8f2] p-4">
              <dt className="text-sm font-medium text-[#1a1714]">{item.question}</dt>
              <dd className="mt-2 text-sm leading-6 text-[#3f3a33]">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
