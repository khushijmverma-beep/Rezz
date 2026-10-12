"use client";

import { useRef, useState } from "react";
import type { ResumeData, Experience, Education, Project } from "@/lib/resumeDetails";

const input =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";
const card = "rounded-lg border border-gray-200 bg-white px-5 pb-7";
const addBtn = "mt-3 cursor-pointer text-sm text-blue-600 hover:underline";
const removeBtn = "cursor-pointer text-sm text-red-600 hover:underline";

function ChipInput({
  title,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t || items.includes(t)) return;
    onChange([...items, t]);
    setText("");
  };
  return (
    <section className={card}>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((it) => (
            <span key={it} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {it}
              <button
                onClick={() => onChange(items.filter((x) => x !== it))}
                aria-label={`Remove ${it}`}
                className="cursor-pointer hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={input}
        />
        <button onClick={add} className="cursor-pointer rounded bg-gray-200 px-3 text-sm hover:bg-gray-300">Add</button>
      </div>
    </section>
  );
}

export default function ResumeDetailsForm({
  value,
  onChange,
  onSave,
  onCancel,
  onUpload,
  saving,
  uploading,
  error,
  banner,
}: {
  value: ResumeData;
  onChange: (next: ResumeData) => void;
  onSave: () => void;
  onCancel: () => void;
  onUpload: (file: File) => void;
  saving: boolean;
  uploading: boolean;
  error: string;
  banner: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ResumeData>(key: K, v: ResumeData[K]) => onChange({ ...value, [key]: v });

  const updateAt = <T,>(list: T[], i: number, patch: Partial<T>) =>
    list.map((it, idx) => (idx === i ? { ...it, ...patch } : it));

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Edit Resume Details</h1>

      {banner && <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{banner}</p>}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {uploading ? "Reading resume…" : "Upload previous resume (.pdf or .txt)"}
        </button>
      </div>

      {/* Contact */}
      <section className={`${card} space-y-2`}>
        <h2 className="text-lg font-semibold">Contact</h2>
        <input value={value.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Full name" className={input} />
        <input type="email" value={value.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" className={input} />
        <input type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className={input} />
        <input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" className={input} />
      </section>

      <ChipInput title="Links" placeholder="Add a link (LinkedIn, GitHub…) and press Enter" items={value.links} onChange={(v) => set("links", v)} />

      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold">About</h2>
        <textarea value={value.summary} onChange={(e) => set("summary", e.target.value)} placeholder="A short summary about you" rows={4} className={input} />
      </section>

      {/* Experience */}
      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold">Experience</h2>
        <div className="space-y-3">
          {value.experience.map((exp, i) => {
            const patch = (p: Partial<Experience>) => set("experience", updateAt(value.experience, i, p));
            return (
              <div key={i} className="space-y-2 rounded border border-gray-200 p-3">
                <input value={exp.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Job title" className={input} />
                <input value={exp.company} onChange={(e) => patch({ company: e.target.value })} placeholder="Company" className={input} />
                <input value={exp.dates} onChange={(e) => patch({ dates: e.target.value })} placeholder="Dates (e.g. Jun 2023 – Aug 2024)" className={input} />
                <div className="space-y-2">
                  {exp.bullets.map((b, j) => (
                    <div key={j} className="flex gap-2">
                      <input
                        value={b}
                        onChange={(e) => patch({ bullets: exp.bullets.map((x, k) => (k === j ? e.target.value : x)) })}
                        placeholder="Bullet point"
                        className={input}
                      />
                      <button onClick={() => patch({ bullets: exp.bullets.filter((_, k) => k !== j) })} aria-label="Remove bullet" className="cursor-pointer px-2 text-red-600">×</button>
                    </div>
                  ))}
                  <button onClick={() => patch({ bullets: [...exp.bullets, ""] })} className="cursor-pointer text-sm text-blue-600 hover:underline">+ Add bullet</button>
                </div>
                <button onClick={() => set("experience", value.experience.filter((_, k) => k !== i))} className={removeBtn}>Remove</button>
              </div>
            );
          })}
        </div>
        <button onClick={() => set("experience", [...value.experience, { company: "", title: "", dates: "", bullets: [] }])} className={addBtn}>+ Add experience</button>
      </section>

      {/* Education */}
      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold">Education</h2>
        <div className="space-y-3">
          {value.education.map((edu, i) => {
            const patch = (p: Partial<Education>) => set("education", updateAt(value.education, i, p));
            return (
              <div key={i} className="space-y-2 rounded border border-gray-200 p-3">
                <input value={edu.school} onChange={(e) => patch({ school: e.target.value })} placeholder="School" className={input} />
                <input value={edu.degree} onChange={(e) => patch({ degree: e.target.value })} placeholder="Degree" className={input} />
                <input value={edu.dates} onChange={(e) => patch({ dates: e.target.value })} placeholder="Dates" className={input} />
                <button onClick={() => set("education", value.education.filter((_, k) => k !== i))} className={removeBtn}>Remove</button>
              </div>
            );
          })}
        </div>
        <button onClick={() => set("education", [...value.education, { school: "", degree: "", dates: "" }])} className={addBtn}>+ Add education</button>
      </section>

      <ChipInput title="Skills" placeholder="Add a skill and press Enter" items={value.skills} onChange={(v) => set("skills", v)} />

      {/* Projects */}
      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold">Projects</h2>
        <div className="space-y-3">
          {value.projects.map((p, i) => {
            const patch = (x: Partial<Project>) => set("projects", updateAt(value.projects, i, x));
            return (
              <div key={i} className="space-y-2 rounded border border-gray-200 p-3">
                <input value={p.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Project name" className={input} />
                <input value={p.link} onChange={(e) => patch({ link: e.target.value })} placeholder="Link" className={input} />
                <textarea value={p.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Description" rows={3} className={input} />
                <button onClick={() => set("projects", value.projects.filter((_, k) => k !== i))} className={removeBtn}>Remove</button>
              </div>
            );
          })}
        </div>
        <button onClick={() => set("projects", [...value.projects, { name: "", link: "", description: "" }])} className={addBtn}>+ Add project</button>
      </section>

      <ChipInput title="Awards" placeholder="Add an award and press Enter" items={value.awards} onChange={(v) => set("awards", v)} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="flex-1 cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button onClick={onCancel} disabled={saving} className="cursor-pointer rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </div>
  );
}