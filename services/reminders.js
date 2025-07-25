const {DateTime} = require('luxon');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
);

function sendReminder() {
    const now = DateTime.local().setZone('Asia/Dhaka');
    client.messages
        .create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: process.env.MY_WHATSAPP_TO,
            body: 'Reminder: You haven’t pushed to GitHub today. Push before 11:59 PM.',
        })
        .then((msg) => {
            console.log(`[${now.toISO()}] Reminder sent, SID: ${msg.sid}`);
        })
        .catch((err) => {
            console.error('Failed to send reminder:', err.message);
        });
}

module.exports = {sendReminder};
