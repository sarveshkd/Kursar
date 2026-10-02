# Kursar

Kursar is the company. Resume Scorer is the product in this app. Upload a PDF, DOCX, or plain-text resume and it scores the page section by section, quoting the lines that are holding the score down.

The default scorer is a local rubric. It does not call an API and does not need a key.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317).

## Publish

A name you own, such as `kursar.com`, is not free. What you can publish for free is a site address from the host, such as `https://your-project.vercel.app`.

Resume Scorer needs a server because it reads PDF and DOCX files. GitHub Pages cannot run that. Vercel’s free Hobby plan can.

1. Create a free [GitHub](https://github.com) account and a free [Vercel](https://vercel.com) account. Use “Continue with GitHub” on Vercel.
2. Create a new public GitHub repository and push this project to it.
3. In Vercel, choose **Add New… → Project**, import that repository, and leave the framework as Next.js.
4. Deploy. Vercel prints a `https://something.vercel.app` link. That link is your free address. Share it.

When you want a real domain later, register one at cost (often about $10 a year for `.com`) from Cloudflare Registrar or Porkbun, then in Vercel open the project → **Settings → Domains** and add it. Vercel shows the DNS records to paste at the registrar.

Leave `SCORER_PROVIDER` unset in Vercel. The site then keeps using the built-in rubric and does not need an API key.

## Search and AdSense

The live address is [https://kursar.vercel.app](https://kursar.vercel.app). Search engines can read `/sitemap.xml` and `/robots.txt`. A privacy page is at `/privacy`.

Search, the free way to be listed:

1. Open [Google Search Console](https://search.google.com/search-console) and add the property `https://kursar.vercel.app`.
2. Choose the HTML tag method. Copy only the `content` value from the meta tag.
3. In the Vercel project, add an environment variable named `GOOGLE_SITE_VERIFICATION` with that value, for Production, then redeploy.
4. Back in Search Console, click Verify, then submit `https://kursar.vercel.app/sitemap.xml`.

AdSense puts ads on the site and pays you. It is a different product from Google Ads, which is where you pay Google to send visitors.

1. Open [Google AdSense](https://www.google.com/adsense/) with the same Google account and add `kursar.vercel.app`.
2. Google reviews the site. The privacy page and the contact page are there for that review. Do not click your own ads once they appear.
3. After approval, AdSense shows a publisher id that looks like `ca-pub-` followed by digits.
4. In Vercel, set `NEXT_PUBLIC_ADSENSE_CLIENT` to that id and redeploy. The site then loads the AdSense script and serves `/ads.txt`. Until that variable is set, no ad script is included.

To try it before you have a file, open the John Doe examples. One is a weak resume and one is a stronger rewrite of the same career.

You can also paste plain text, or upload `.pdf`, `.docx`, `.txt`, or `.md`.

```bash
npm test
npm run lint
```

## What the scores mean

Each score is 0–100.

| Band | Range | How to read it |
| --- | --- | --- |
| Needs work | 0–44 | A screener would stall on this part |
| Uneven | 45–64 | The section exists, but the proof is thin |
| Solid | 65–79 | Usable, with a few lines still to tighten |
| Strong | 80–100 | Specific, and the lines carry evidence |

**Overall** is a weighted blend, not a vibe:

- Experience and impact: 34%
- ATS / formatting: 20%
- Skills: 18%
- Summary / profile: 16%
- Education: 12%

**Summary / profile** looks for a role, a result, and a short opening. It marks down “seeking a challenging position,” trait slogans, and summaries with no number.

**Experience and impact** reads the bullets. It wants an action verb, a measure (a count, a percent, a duration, money), and dates on the roles. “Responsible for,” “worked on,” and “various tasks” are treated as weak lines.

**Skills** separates tools from traits such as “teamwork” or “hardworking.” A tool that never appears in the experience bullets is called out by name.

**Education** wants a degree, a school, and a year. A line that only says “College” scores as incomplete.

**ATS / formatting** checks the extracted text for an email, a phone number, the headings Summary, Experience, Skills, and Education, a readable length, and consistent date styles. It also flags a keyword repeated until it looks stuffed, and lines so long they usually mean a table or text box collapsed.

Every part includes a short reason and at least one change. The quoted line is copied from the extract.

## How scoring works without a key

`createScorer()` in `src/lib/scoring/index.ts` returns the rubric scorer unless you opt in. An `OPENAI_API_KEY` sitting in the environment is not enough to switch engines.

The rubric lives in `src/lib/scoring/rubric.ts`. It parses headings, then inspects the text that was actually extracted: metrics, action verbs, section presence, length, contact details, dates, buzzwords, and vague bullets. PDF text is extracted with `unpdf` (PDF.js). DOCX text is extracted with Mammoth. Neither path reads the binary file as UTF-8.

To plug in OpenAI later, set:

```bash
SCORER_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

The OpenAI adapter uses the same `ResumeScorer` interface and must quote the resume verbatim. If the model response fails that check, the request falls back to the rubric.

## Limits

- Scanned or photographed PDFs have no text layer, so they are rejected with a clear error. Export a text-based PDF or paste the words.
- Legacy `.doc` files are rejected. Save as `.docx` or PDF.
- Multi-column layouts and text boxes can extract out of order. The extract panel is there so you can see when that happened.
- The rubric does not read a job posting, so it cannot score keyword fit for one role.
- It does not invent your metrics. Where a line has no number, the suggestion shows the shape of a rewrite and tells you to use figures you can defend.
