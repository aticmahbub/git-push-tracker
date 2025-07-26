const axios = require('axios');
require('dotenv').config();
const {DateTime} = require('luxon');

let weeklyCommitLog = []; // In-memory commit log for the week

async function hasCommittedToday(username) {
    const today = DateTime.local().setZone('Asia/Dhaka').toISODate();

    try {
        const res = await axios.get(
            `https://api.github.com/users/${username}/events/public`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    'User-Agent': 'github-push-notifier',
                    Accept: 'application/vnd.github.v3+json',
                },
            },
        );

        const pushEventsToday = res.data.filter((event) => {
            const eventDate = DateTime.fromISO(event.created_at).toISODate();
            return event.type === 'PushEvent' && eventDate === today;
        });

        let commitsToday = [];

        // Store commit info in weekly memory log and collect today's commits
        pushEventsToday.forEach((event) => {
            event.payload.commits?.forEach((commit) => {
                const commitData = {
                    repo: event.repo.name,
                    message: commit.message,
                    timestamp: event.created_at,
                };
                commitsToday.push(commitData);
                weeklyCommitLog.push(commitData); // keep weekly log updated
            });
        });

        return {
            committed: commitsToday.length > 0,
            count: commitsToday.length,
            commits: commitsToday,
        };
    } catch (e) {
        console.error('GitHub API error:', e.message);
        return {committed: false, count: 0, commits: []};
    }
}

function getWeeklyLog() {
    return weeklyCommitLog;
}

function resetWeeklyLog() {
    weeklyCommitLog = [];
}

module.exports = {hasCommittedToday, getWeeklyLog, resetWeeklyLog};

// const axios = require('axios');
// require('dotenv').config();
// const {DateTime} = require('luxon');

// async function hasCommittedToday(username) {
//     const today = DateTime.local().setZone('Asia/Dhaka').toISODate();
//     try {
//         const res = await axios.get(
//             `https://api.github.com/users/${username}/events/public`,
//             {
//                 headers: {
//                     Authorization: `token ${process.env.GITHUB_TOKEN}`,
//                     'User-Agent': 'github-push-notifier',
//                     Accept: 'application/vnd.github.v3+json',
//                 },
//             },
//         );

//         return res.data.some((event) => {
//             const eventDate = DateTime.fromISO(event.created_at).toISODate();
//             return event.type === 'PushEvent' && eventDate === today;
//         });
//     } catch (e) {
//         console.error('GitHub API error:', e.message);
//         return false;
//     }
// }

// module.exports = {hasCommittedToday};
