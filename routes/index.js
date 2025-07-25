const express = require('express');
const {DateTime} = require('luxon');
const {hasCommittedToday} = require('../services/commitChecker');
const {sendReminder} = require('../services/reminders');
const {sendWeeklySummary} = require('../services/summary');

const router = express.Router();
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
let lastReminderTime = null;
const serverStart = DateTime.local().setZone('Asia/Dhaka');

// GET /
router.get('/', async (req, res) => {
    const committed = await hasCommittedToday(GITHUB_USERNAME);
    res.json({pushedToday: committed});
});

// GET /status
router.get('/status', async (req, res) => {
    const now = DateTime.local().setZone('Asia/Dhaka');
    const committed = await hasCommittedToday(GITHUB_USERNAME);
    res.json({
        date: now.toISODate(),
        pushedToday: committed,
        lastReminderSentAt: lastReminderTime
            ? lastReminderTime.toFormat('HH:mm:ss')
            : 'Never',
    });
});

// GET /remind
router.get('/remind', (req, res) => {
    sendReminder();
    lastReminderTime = DateTime.local().setZone('Asia/Dhaka');
    res.json({message: 'Manual reminder sent'});
});

// GET /summary
router.get('/summary', (req, res) => {
    sendWeeklySummary();
    res.json({message: 'Manual weekly summary sent'});
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
