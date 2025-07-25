require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const {DateTime} = require('luxon');
const {hasCommittedToday} = require('./services/commitChecker');
const {sendReminder} = require('./services/reminders');
const {sendWeeklySummary} = require('./services/summary');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

let weeklyCommitStatus = {};
let lastReminderTime = null;
const serverStart = DateTime.local().setZone('Asia/Dhaka');

app.use('/', routes);

// CRON: Every minute
cron.schedule('* * * * *', async () => {
    const now = DateTime.local().setZone('Asia/Dhaka');
    const hour = now.hour;
    const minute = now.minute;
    const todayStr = now.toISODate();

    // Reset weekly status on Sunday 00:00
    if (now.weekday === 7 && hour === 0 && minute === 0) {
        weeklyCommitStatus = {};
        console.log('Weekly commit status reset');
    }

    const committedToday = await hasCommittedToday(GITHUB_USERNAME);
    weeklyCommitStatus[todayStr] = committedToday;

    if (!committedToday && hour >= 20 && hour < 24) {
        const minutesSinceLast = lastReminderTime
            ? now.diff(lastReminderTime, 'minutes').minutes
            : Infinity;

        const interval = hour >= 22 ? 30 : 60;

        if (minutesSinceLast >= interval) {
            sendReminder();
            lastReminderTime = now;
        }
    }
});

// CRON: Weekly Summary every Saturday 23:59
cron.schedule('59 23 * * 6', () => {
    sendWeeklySummary(weeklyCommitStatus);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
