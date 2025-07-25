# GitHub Commit Tracker with WhatsApp Reminders

This Node.js app tracks your daily GitHub commit activity and sends WhatsApp reminders if you haven't committed. It also sends a weekly summary every Saturday night.

## Features

- Tracks daily GitHub commit status
- Sends WhatsApp reminders after 8 PM if no commit
- Reminders after 10 PM are sent every 30 minutes till 11:59 PM
- Sends a weekly summary every Saturday at 11:59 PM
- REST API endpoints to get status and control reminders
- No file system usage (fully in-memory)

---

## Technologies Used

- Node.js
- Express
- Axios
- Luxon
- Twilio
- node-cron
- GitHub API

---

## Setup Instructions

### 1. Clone the repository

    git clone https://github.com/aticmahbub/github-push-notifier.git
    cd github-push-notifier

### 2. Install dependencies

    npm install

### 3. Configure environment variables

Create a `.env` file in the root with:

    PORT=3000
    GITHUB_USERNAME=your_github_username
    GITHUB_TOKEN=your_github_pat
    TWILIO_ACCOUNT_SID=your_twilio_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
    MY_WHATSAPP_TO=whatsapp:+8801XXXXXXXXX

> Your GitHub token must have public repo access.

### 4. Start the server

    node index.js

---

## API Endpoints

### GET `/`

Check if you've committed today.

**Response:**

    {
      "pushedToday": true
    }

---

### GET `/status`

Get detailed status and last reminder time.

**Response:**

    {
      "date": "2025-07-25",
      "pushedToday": false,
      "lastReminderSentAt": "22:30:00"
    }

---

### GET `/remind`

Trigger a manual reminder message via WhatsApp.

**Response:**

    {
      "message": "Manual reminder sent!"
    }

---

### GET `/summary`

Manually send the weekly summary.

**Response:**

    {
      "message": "Manual weekly summary sent!"
    }

---

### GET `/uptime`

Get current server uptime.

**Response:**

    {
      "startedAt": "2025-07-25 18:00:00",
      "uptime": {
        "hours": 3,
        "minutes": 42
      }
    }

---

## Reminder Logic

- After 8:00 PM: reminders sent every 1 hour if no commit.
- After 10:00 PM: reminders sent every 30 minutes.
- No reminders after 11:59 PM.
- Weekly summary sent at 11:59 PM every Saturday.

---

## Deployment

You can deploy on platforms like:

- Render
- Railway
- Vercel (serverless with adjustments)
- Glitch

Make sure to set all `.env` variables in your deploy settings.

---
