# Study-Hub

Study-Hub is a full-stack learning companion for computer science students. It combines curated study resources, AI-assisted planning, subject-wise quizzes, collaborative notes, and a built-in code runner into a single workspace.

---

## Table of Contents
- [What's New](#whats-new)
- [How Study-Hub Works](#how-study-hub-works)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Apps](#running-the-apps)
- [Troubleshooting](#troubleshooting)

---

---

## What's New
- **Exam Simulator:** 40-question, 45-minute mock exams with history tracking, streak bonuses, and secure result storage via `/exam` APIs.
- **Placement Hub:** Dedicated `Placement`, `SubjectExam`, and `SubjectDetail` pages surfacing job-focused resources and curated subject roadmaps.
- **Expanded Auth UX:** Forgot/Reset password flows, richer login component, and subject-driven dashboards backed by the new `subjects.js` data layer.
- **Progress Intelligence:** `streakUtils` powers streak history, while exam attempts now feed dashboards and recommendations.

---

## How Study-Hub Works
1. **Sign up or log in** to create a secure profile backed by JWT-authenticated APIs.
2. **Explore the dashboard** for subject shortcuts, study streaks, quiz performance, and personalized recommendations.
3. **Deep-dive into subjects** via dedicated pages containing summaries, flash resources, and action cards.
4. **Practice with quizzes** (subject-wise or mixed) and store scores for analytics and AI recommendations.
5. **Use the Notes workspace** to build, tag, and download study notes per subject.
6. **Launch the AI Predictor** to simulate readiness, get focus areas, and receive alerts based on exam timelines.
7. **Chat with the StudyBot** for instant help, resources, and guidance powered by OpenRouter LLMs.
8. **Compile code instantly** inside the integrated Monaco editor that proxies Judge0 for Python/Java execution.
9. **Manage resources and contacts** through protected routes and share feedback via the Contact page.

---

## Key Features
- **Unified dashboard** with progress charts, quick subject cards, and reminders.
- **Auth-protected resources** including downloads, external links, and curated study kits.
- **Subject quizzes & analytics** storing history for future recommendations.
- **Timed exam mode** delivering proctored-style attempts (40 Qs/45 min) with result history, streak boosts, and violation logging.
- **AI exam readiness predictor** offering plans based on inputs, study hours, and quiz history.
- **Smart StudyBot** using OpenRouter for contextual assistance aligned with Study-Hub’s feature set.
- **Code editor + Judge0 runner** to test Python and Java snippets without leaving the app.
- **Notes Studio** per subject with PDF export, versioning, and tagging.
- **Placement prep hub** with subject deep-dives, combined exam listings, and curated prep journeys.
- **Account recovery** covering forgot / reset password UI flows and secure token validation.
- **Profile center** for avatar management, settings, and security actions.
- **Responsive UI** built with React, Bootstrap, Chart.js, and face-api enhancements.

---

## Tech Stack
- **Frontend:** React 19, React Router, Bootstrap 5, Chart.js, Monaco Editor, face-api.js.
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT auth, Axios, Cloudinary helpers.
- **AI & Integrations:** OpenRouter (chatbot), Judge0 via RapidAPI (code execution).
- **Tooling:** Nodemon, ESLint (CRA defaults), npm workspaces (manual).

---

## Project Structure
```
studyhubtrail-main/
├── backend/        # Express API, Mongo models, routes, controllers
│   └── utils/      # Shared helpers (e.g., streak tracking)
├── frontend/       # React SPA
│   ├── src/components/Exam.jsx
│   ├── src/components/ForgotPassword.jsx
│   ├── src/components/ResetPassword.jsx
│   ├── src/components/SubjectDetail.jsx
│   ├── src/data/subjects.js
│   └── src/pages/{ExamPage, Placement, SubjectExam}.js
└── screenshots/    # Project visuals used in README
```

---

## Prerequisites
- Node.js 18+ and npm 9+
- MongoDB Atlas cluster or local MongoDB instance
- Git & GitHub access
- Optional: RapidAPI key for Judge0, OpenRouter account for chatbot

---

## Installation & Setup
Clone the repo and install dependencies for both services:

```bash
git clone https://github.com/Narvasiddhartha/Study-Hub.git
cd Study-Hub

# Backend setup
cd backend
npm install

# Frontend setup (new terminal or after backend)
cd ../frontend
npm install
```

---

## Environment Variables
Create `backend/.env` with the following keys:

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace_me
OPENROUTER_API_KEY=sk-or-...
JUDGE0_API_KEY=your_rapidapi_key    # optional (defaults to placeholder)
PORT=5001
```

> Update `backend/server.js` CORS origin if you deploy frontend elsewhere. Add provider keys (Cloudinary, email, etc.) as needed. Never commit `.env`.

---

## Running the Apps
Start the backend API:

```bash
cd backend
npm run dev        # or npm start
```

Start the frontend React app in a separate shell:

```bash
cd frontend
npm start
```

The frontend expects the backend at `http://localhost:5001`. Update `frontend/src/api/axios.js` if you change the API base URL.

---

## Troubleshooting
- **Mongo connection errors:** verify `MONGO_URI`, whitelisted IPs, and network rules.
- **401 on protected routes:** ensure the frontend saves JWT tokens and that your `.env` `JWT_SECRET` matches across sessions.
- **Chatbot/AI failures:** confirm `OPENROUTER_API_KEY` scope and usage limits.
- **Judge0 timeouts:** RapidAPI free tier has low throughput; consider caching or paid tier keys.

Happy building & learning! 🎓
