import type { Metadata } from "next"
import { ReviewDesk } from "@/components/review-desk"
import { SITE_URL } from "@/lib/contact"
import { SEARCH_ANSWERS } from "@/lib/search-copy"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SEARCH_ANSWERS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
  url: SITE_URL,
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <ReviewDesk />
    </>
  )
}
