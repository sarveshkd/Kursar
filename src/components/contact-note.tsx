"use client"

import { FormEvent, useState } from "react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTACT_EMAIL } from "@/lib/contact"

export function ContactNote() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedNote = note.trim()
    const trimmedEmail = email.trim()
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setOpened(false)
      setError("Add an email address so a reply has somewhere to go.")
      return
    }
    if (trimmedNote.length < 8) {
      setOpened(false)
      setError("Write a short note before sending.")
      return
    }
    const subject = encodeURIComponent("Note for Kursar Resume Scorer")
    const body = encodeURIComponent(
      [`Name: ${name.trim() || "Not given"}`, `Email: ${trimmedEmail}`, "", trimmedNote].join("\n"),
    )
    setError(null)
    setOpened(true)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <form onSubmit={send} className="border border-[#1a1714] bg-[#f7f3ea] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-[#6B7C3A]" aria-hidden="true" />
        <h2 className="text-sm font-medium text-[#1a1714]">Write a note</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#3f3a33]">
        If a score missed a line, or you want to say how the checker treated your resume, write it here. Sending opens
        your email app with the note addressed to Kursar.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[#5c564c]">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            name="name"
            autoComplete="name"
            className="mt-1 w-full border border-[#cfc6b6] bg-[#fbf8f2] px-3 py-2 text-[#1a1714] outline-none focus:border-[#6B7C3A]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#5c564c]">Your email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full border border-[#cfc6b6] bg-[#fbf8f2] px-3 py-2 text-[#1a1714] outline-none focus:border-[#6B7C3A]"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="text-[#5c564c]">Note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          name="note"
          required
          rows={6}
          placeholder="What should Kursar know about the score, or about the checker?"
          className="mt-1 w-full border border-[#cfc6b6] bg-[#fbf8f2] px-3 py-2 text-[#1a1714] outline-none focus:border-[#6B7C3A]"
        />
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#9c341f]">
          {error}
        </p>
      ) : null}
      {opened ? (
        <p className="mt-3 text-sm text-[#234237]">Your email app should open with this note. Send it from there.</p>
      ) : null}
      <Button type="submit" className="mt-4 rounded-none">
        Send by email
      </Button>
    </form>
  )
}
