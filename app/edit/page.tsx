"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const input =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export default function EditPage() {
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [saved, setSaved] = useState(false);

  // load from localStorage on open, and again whenever the sidebar finishes an upload
  useEffect(() => {
    const load = () => {
      const data = localStorage.getItem("resumeInfo");
      if (!data) return;
      const parsed = JSON.parse(data);
      setExperience(parsed.experience ?? "");
      setEducation(parsed.education ?? "");
      setSkills(parsed.skills ?? "");
    };

    load();
    window.addEventListener("resumeInfoUpdated", load);
    return () => window.removeEventListener("resumeInfoUpdated", load);
  }, []);

  const handleSave = () => {
    localStorage.setItem("resumeInfo", JSON.stringify({ experience, education, skills }));
    window.dispatchEvent(new Event("resumeInfoUpdated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to home
      </Link>

      <h1 className="text-xl font-semibold">Edit Resume Information</h1>

      <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Experience" rows={5} className={input} />
      <textarea value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education" rows={3} className={input} />
      <textarea value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills" rows={2} className={input} />

      <button
        onClick={handleSave}
        className="w-full cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        {saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}