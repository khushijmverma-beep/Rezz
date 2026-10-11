"use client";

import { useState } from "react";
import type { ResumeData } from "@/lib/types/resume";

const MAX_CHARS = 8000;

type Props = {
  onFill: (fields: Partial<ResumeData>) => void;
};

export default function ResumeDetailsChat({ onFill }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const tooLong = text.length > MAX_CHARS;
  const canSend = text.trim().length > 0 && !tooLong && !loading;

  function send() {
    if (!canSend) return;
    console.log("sending:", text);
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

      <div></div>

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