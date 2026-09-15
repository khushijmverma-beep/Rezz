# Rezz

Rezz is an AI-powered resume builder. Instead of drafting a resume in a generic doc editor, users pick from multiple professionally designed templates, create and manage multiple resume drafts, and export polished PDFs — all in one place.

## Features

### Resume Building
- Multiple professionally designed templates
- Create, save, and manage multiple resume drafts
- Export finished resumes as PDFs

### AI Analysis
Built-in AI analysis reviews a resume and provides feedback on:
- Grammar and phrasing issues
- Gaps compared to the user's LinkedIn profile/summary
- Redundant or repetitive content

## Tech Stack

### Frontend
- **Next.js** — framework and routing
- **Tailwind CSS** — styling

### Backend & Data
- **Firebase Auth** — user authentication
- **Firestore** — storing resume drafts and user data

### AI & Export
- **Gemini API** — AI resume analysis
- **react-pdf / jsPDF** — PDF export

### Deployment
- **Vercel**

## Getting Started

### Prerequisites
- Node.js installed
- A Firebase project set up
- A Gemini API key

### Installation
```bash
git clone [REPO_URL]
cd rezz
npm install
```

### Environment Setup
Create a `.env.local` file with your Firebase and Gemini API keys.

### Run Locally
```bash
npm run dev
```

## Project Status
Built as part of a GDSC UTD mentorship sprint.
