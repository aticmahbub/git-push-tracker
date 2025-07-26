const express = require('express');
const router = express.Router();
require('dotenv').config();
const {DateTime} = require('luxon');
const {sendReminder} = require('../services/reminders');
const {
    getWeeklyLog,
    resetWeeklyLog,
    hasCommittedToday,
} = require('../services/commitChecker');
const {getPingLogs, logPing} = require('../services/pingLogger');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
let lastReminderTime = null;
const serverStart = DateTime.local().setZone('Asia/Dhaka');

// PING
router.get('/ping', async (req, res) => {
    const log = await logPing(req);
    console.log('[PING]', log);
    res.send('Pong with location logged!');
});

router.get('/ping-logs', (req, res) => {
    res.json(getPingLogs());
});
// GET /
router.get('/', async (req, res) => {
    const committed = await hasCommittedToday(GITHUB_USERNAME);
    if (committed) {
        return res.send('You have pushed today. Keep pushing everyday!!!');
    } else {
        return res.send("You haven't pushed yet. Please push immediately");
    }
});

// GET /status
router.get('/status', async (req, res) => {
    try {
        const now = DateTime.local().setZone('Asia/Dhaka');
        const {committed, count, commits} =
            await hasCommittedToday(GITHUB_USERNAME);

        return res.json({
            date: now.toISODate(),
            pushedToday: committed,
            commitCount: count,
            commits, // array of commit objects: { repo, message, timestamp }
            lastReminderSentAt: lastReminderTime
                ? lastReminderTime.toFormat('HH:mm:ss')
                : 'Never',
        });
    } catch (error) {
        console.error('Error in /status route:', error.message);
        return res.status(500).json({error: 'Unable to fetch status'});
    }
});

// GET /remind
router.get('/remind', (req, res) => {
    sendReminder();
    lastReminderTime = DateTime.local().setZone('Asia/Dhaka');
    res.json({message: 'Manual reminder sent'});
});

// GET /summary
router.get('/summary', (req, res) => {
    const weeklyLog = getWeeklyLog();

    if (weeklyLog.length === 0) {
        return res.json({message: 'No commits made this week.'});
    }

    // Generate summary per day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const summary = {};

    weeklyLog.forEach((commit) => {
        const date = DateTime.fromISO(commit.timestamp, {zone: 'Asia/Dhaka'});
        const day = days[date.weekday % 7]; // Sunday = 0
        if (!summary[day]) summary[day] = [];
        summary[day].push(`• [${commit.repo}] ${commit.message}`);
    });

    let message = `📅 *Weekly Commit Summary*\n\n`;

    days.forEach((day) => {
        if (summary[day]) {
            message += `✅ *${day}*:\n${summary[day].join('\n')}\n\n`;
        } else {
            message += `❌ *${day}*: No commits\n\n`;
        }
    });

    // Send the message using Twilio or log it
    console.log(message); // You can replace this with your sendWhatsApp(message)

    // Reset the log after sending
    resetWeeklyLog();

    res.json({message: 'Weekly summary sent successfully.', summary});
});

// GET /uptime
router.get('/uptime', (req, res) => {
    const now = DateTime.local().setZone('Asia/Dhaka');
    const uptime = now.diff(serverStart, ['hours', 'minutes']).toObject();
    res.json({
        startedAt: serverStart.toFormat('yyyy-MM-dd HH:mm:ss'),
        uptime: {
            hours: Math.floor(uptime.hours),
            minutes: Math.floor(uptime.minutes),
        },
    });
});

module.exports = router;
