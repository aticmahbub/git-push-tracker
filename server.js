require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const {DateTime} = require('luxon');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
);

const app = express();
const PORT = process.env.PORT || 3000;

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

let weeklyCommitStatus = {};
let lastReminderTime = null;

async function hasCommittedToday(username) {
    const today = DateTime.local().setZone('Asia/Dhaka').toISODate();
    try {
        const res = await axios.get(
            `https://api.github.com/users/${username}/events/public`,
            {
                headers: {
                    'User-Agent': 'GitHub-Commit-Checker',
                    Accept: 'application/vnd.github.v3+json',
                },
            },
        );
        return res.data.some((event) => {
            const eventDate = DateTime.fromISO(event.created_at).toISODate();
            return event.type === 'PushEvent' && eventDate === today;
        });
    } catch (e) {
        console.error('GitHub API error:', e.message);
        return false;
    }
}

function sendReminder() {
    const now = DateTime.local()
        .setZone('Asia/Dhaka')
        .toFormat('yyyy-MM-dd HH:mm:ss');
    client.messages
        .create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: process.env.MY_WHATSAPP_TO,
            body: '⏰ Reminder: You haven’t pushed to GitHub today! Please push before 11:59 PM 🕛',
        })
        .then((msg) => console.log(`[${now}] Reminder sent, SID: ${msg.sid}`))
        .catch((err) => console.error('Failed to send reminder:', err.message));
}

function sendWeeklySummary() {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const summaryLines = [];

    const now = DateTime.local().setZone('Asia/Dhaka');
    const startOfWeek = now.startOf('week');

    for (let i = 0; i < 7; i++) {
        const day = startOfWeek.plus({days: i});
        const dateStr = day.toISODate();
        const committed = weeklyCommitStatus[dateStr] === true;
        const mark = committed ? '✅' : '❌';
        summaryLines.push(`${mark} ${daysOfWeek[day.weekday % 7]}`);
    }

    const message = `📅 Weekly GitHub Commit Summary:\n${summaryLines.join('\n')}\nKeep pushing! 💪`;

    client.messages
        .create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: process.env.MY_WHATSAPP_TO,
            body: message,
        })
        .then((msg) =>
            console.log(
                `[${now.toFormat('yyyy-MM-dd HH:mm:ss')}] Weekly summary sent, SID: ${msg.sid}`,
            ),
        )
        .catch((err) =>
            console.error('Failed to send weekly summary:', err.message),
        );
}

// Reminder check every minute
cron.schedule('* * * * *', async () => {
    const now = DateTime.local().setZone('Asia/Dhaka');
    const hour = now.hour;
    const minute = now.minute;
    const todayStr = now.toISODate();

    // Reset weekly status on Sunday midnight
    if (now.weekday === 7 && hour === 0 && minute === 0) {
        weeklyCommitStatus = {};
        console.log('🔄 Weekly commit status reset');
    }

    // Update today's commit status
    const committedToday = await hasCommittedToday(GITHUB_USERNAME);
    weeklyCommitStatus[todayStr] = committedToday;

    // Send reminders if not committed yet, between 8 PM and midnight
    if (!committedToday && hour >= 20 && hour < 24) {
        const minutesSinceLastReminder = lastReminderTime
            ? now.diff(lastReminderTime, 'minutes').minutes
            : Infinity;

        const interval = hour >= 22 ? 30 : 60;

        if (minutesSinceLastReminder >= interval) {
            sendReminder();
            lastReminderTime = now;
        }
    }
});

// Weekly summary every Saturday 23:59
cron.schedule('59 23 * * 6', () => {
    sendWeeklySummary();
});

app.get('/status', async (req, res) => {
    const committed = await hasCommittedToday(GITHUB_USERNAME);
    res.json({pushedToday: committed});
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
