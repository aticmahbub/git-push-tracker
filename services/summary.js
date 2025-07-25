const {DateTime} = require('luxon');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
);

function sendWeeklySummary(status = {}) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = DateTime.local().setZone('Asia/Dhaka');
    const start = now.startOf('week');

    const summary = Array.from({length: 7}).map((_, i) => {
        const day = start.plus({days: i});
        const dateStr = day.toISODate();
        const committed = status[dateStr] === true;
        return `${committed ? 'Yes' : 'No'} - ${days[day.weekday % 7]}`;
    });

    const message = `Weekly GitHub Commit Summary:\n${summary.join('\n')}\nKeep it up.`;

    client.messages
        .create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: process.env.MY_WHATSAPP_TO,
            body: message,
        })
        .then((msg) => {
            console.log(
                `[${now.toISO()}] Weekly summary sent, SID: ${msg.sid}`,
            );
        })
        .catch((err) => {
            console.error('Failed to send summary:', err.message);
        });
}

module.exports = {sendWeeklySummary};
