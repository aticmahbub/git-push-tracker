const axios = require('axios');
const {DateTime} = require('luxon');

async function hasCommittedToday(username) {
    const today = DateTime.local().setZone('Asia/Dhaka').toISODate();
    try {
        const res = await axios.get(
            `https://api.github.com/users/${username}/events/public`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    'User-Agent': 'commit-checker',
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

module.exports = {hasCommittedToday};
