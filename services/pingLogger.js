const axios = require('axios');

const pingLogs = [];

async function logPing(req) {
    const timestamp = new Date().toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
    });

    const ip =
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || 'N/A';

    let location = 'Unknown';
    try {
        const res = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${res.data.city}, ${res.data.region}, ${res.data.country_name}`;
    } catch (e) {
        console.error('Geo lookup failed:', e.message);
    }

    const logEntry = {
        timestamp,
        ip,
        location,
        userAgent,
        referer,
    };

    pingLogs.push(logEntry);
    if (pingLogs.length > 100) pingLogs.shift();

    return logEntry;
}

function getPingLogs() {
    return pingLogs;
}

module.exports = {logPing, getPingLogs};
