"use client";

import { useRef, useState } from "react";
import type { ResumeData } from "@/lib/types/resume";

const MAX_CHARS = 8000;

const FIELD_LABELS: Record<keyof ResumeData, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone number",
  location: "Location",
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Website",
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  awards: "Awards",
};

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type Props = {
  onFill: (fields: Partial<ResumeData>) => void;
};

export default function ResumeDetailsChat({ onFill }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const nextId = useRef(0);

  const tooLong = text.length > MAX_CHARS;
  const canSend = text.trim().length > 0 && !tooLong && !loading;

  async function send() {
    if (!canSend) return;

    const input = text;
    const userId = ++nextId.current;
    const pendingId = ++nextId.current;


    setMessages((prev): Message[] => [
      ...prev,
      { id: userId, role: "user", text: text },
      { id: pendingId, role: "assistant", text: "Reading..." },
    ]);

    setText("");
    setLoading(true);

    let reply = "Something went wrong. Please try again.";

    try {
      const res = await fetch("/api/fill-resume-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (res.status === 422) {
        reply = "Please try again with more specific info.";
      } else if (res.ok) {
        const data = (await res.json()) as { fields: Partial<ResumeData> };
        const fields = data.fields;

        const keys = Object.keys(fields) as (keyof ResumeData)[];
        const labels = keys.map((key) => FIELD_LABELS[key]);

        reply = `Filled in: ${labels.join(", ")}. Review the fields, then save.`;

        onFill(fields);
      }
    } catch (error) {
      console.log("request failed:", error);
    }

      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, text: reply } : m))
      );
      setLoading(false);
    }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        send();
      }
    }

    return (
      <section>
        <h2>Paste your info</h2>

        <div>
          {messages.map((message) => (
            <div key={message.id}>{message.text}</div>
          ))}
        </div>

        <textarea
          placeholder="Paste your resume info, LinkedIn About section, or anything you want added"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div>
          <span>
            {text.length} / {MAX_CHARS.toLocaleString()}
          </span>
          <button type="button" onClick={send} disabled={!canSend}>
            Send
          </button>
        </div>
      </section>
    );
  }
