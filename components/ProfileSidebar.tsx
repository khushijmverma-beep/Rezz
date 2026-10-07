"use client"

import React, { useState, useRef } from 'react';
import Link from "next/link"


const input =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export default function Sidebar() {
    const [open, setOpen] = useState(false); 
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);

    // profile layout for the five inputs
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    setProfile({ ...profile, [e.target.name]: e.target.value}); 

    // extract text from PDF
    const extractText = async (pdfFile: File) => {
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", pdfFile);

        try {
            const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong.");
                return;
            }

            setProfile({
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                linkedin: data.linkedin,
        });

        localStorage.setItem(
            "resumeInfo",
            JSON.stringify({
                experience: data.experience,
                education: data.education,
                skills: data.skills,
            })
        );
    } catch {
        setError("Network error. Please try again.");
    } finally {
        setLoading(false);
    }
};

    // handles the file, validates if it's a PDF, and if anything changed
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]

        if (!selected) return; 

        if (selected.type !== "application/pdf") {
            setError("Invalid format, please use a PDF")
            setFile(null);
            return;
        }

        setError("");
        setFile(selected);
        extractText(selected);

    }

    return (
        <div>
            <div onClick={() => setOpen(false)}
                className={`fixed inset-0 z-30 bg-transparent transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
/>
            <aside id="sidebar"
            className = {`fixed top-0 left-0 z-40 h-full w-80 bg-gray-100 p-4 shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${open ? "translate-x-0" : "-translate-x-full"}`}>
             
            <h2 className = "mb-2 text-lg font-semibold">Profile</h2>
            <div className="space-y-2">
                <input name="name" value={profile.name} onChange={handleChange} placeholder="Name" className={input} />
                <input name="email" type="email" value={profile.email} onChange={handleChange} placeholder="Email" className={input} />
                <input name="phone" type="tel" value={profile.phone} onChange={handleChange} placeholder="Phone" className={input} />
                <input name="location" value={profile.location} onChange={handleChange} placeholder="Location" className={input} />
                <input name="linkedin" type="url" value={profile.linkedin} onChange={handleChange} placeholder="LinkedIn URL" className={input} />
            </div>
            <Link href="/edit" onClick ={() => setOpen(false)} className= "text-center block rounded bg-blue-600 px-4 py-2.5 mt-4 text-sm text-white! hover:bg-blue-700"> Edit Resume Information </Link>
            {file && (
                <p className="mt-3 truncate text-sm text-gray-700">Selected: {file.name}</p>
                
            )}
            {loading && <p className="mt-2 text-sm text-gray-500">Reading resume…</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
 
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />

            <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full cursor-pointer rounded bg-blue-600 px-4 py-2 mt-4  text-white hover:bg-blue-700"
            >
                Upload Resume PDF
            </button>
          </aside>

          <main className = {'p-4 transition-[margin] duration-300 ease-in-out ${open ? "ml-64" : "ml-0"}'}>
            <button 
            onClick = {() => setOpen((o) => !o)} 
            aria-expanded={open}
            aria-controls="sidebar"
            className="flex cursor-pointer flex-col gap-1.5 rounded-full bg-transparent p-3 hover:bg-transparent"
                > 
                <span className="block h-0.5 w-7 rounded bg-black" />
                <span className="block h-0.5 w-7 rounded bg-black" />
                <span className="block h-0.5 w-7 rounded bg-black" />               
            </button>
          </main>
        </div>
    )
}