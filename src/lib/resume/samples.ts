export type SampleId = "weak" | "strong"

export interface SampleResume {
  id: SampleId
  filename: string
  title: string
  detail: string
  text: string
}

const WEAK_TEXT = `JOHN DOE
Hard worker and team player

Objective
Seeking a challenging position where I can utilize my skills and grow with a dynamic company. I am a passionate, results-driven professional and a self-starter who thinks outside the box.

Experience
Retail Helper, Some Store
Worked on various tasks and helped the team with day to day operations.
Responsible for handling customer issues and other duties as assigned.
Participated in meetings and assisted with projects.

Skills
Communication, Microsoft Office, Teamwork, Hardworking, Leadership, Problem Solving, Fast learner, Detail-oriented

Education
College
`

const STRONG_TEXT = `John Doe
john.doe@email.com | (415) 555-0148 | San Francisco, CA | linkedin.com/in/johndoe

Summary
Customer support lead with 6 years turning high-volume inboxes into measurable retention. Cut repeat contacts 18% at Northwind by rewriting the returns macro set and coaching a team of 11.

Experience
Northwind Goods — Support Lead | San Francisco, CA | Mar 2021 – Present
- Built a Looker dashboard and a Zendesk macro library that cut average handle time from 9.4 to 6.1 minutes across 22,000 monthly tickets.
- Coached 11 agents through weekly call reviews, lifting CSAT from 78% to 91% in two quarters.
- Replaced a weekly Excel export with a SQL pull, removing 4 hours of reporting for the ops team.

Brightline Retail — Support Specialist | Oakland, CA | Jun 2018 – Feb 2021
- Resolved 45–60 tickets a day during peak season while keeping first-contact resolution above 82%.
- Wrote 30 help-center articles that deflected an estimated 1,200 tickets per quarter.

Skills
Support operations: Zendesk, Gorgias
Analysis: Excel, SQL, Looker
Coaching: QA scorecards, call calibration

Education
B.A. Communication Studies, San Jose State University, 2018
`

export const SAMPLES: Record<SampleId, SampleResume> = {
  weak: {
    id: "weak",
    filename: "john-doe-weak.txt",
    title: "Example: weak resume",
    detail: "John Doe. Traits and vague lines, no numbers.",
    text: WEAK_TEXT.trim(),
  },
  strong: {
    id: "strong",
    filename: "john-doe-strong.txt",
    title: "Example: stronger resume",
    detail: "The same John Doe resume, rewritten with results.",
    text: STRONG_TEXT.trim(),
  },
}

export function isSampleId(value: unknown): value is SampleId {
  return value === "weak" || value === "strong"
}
