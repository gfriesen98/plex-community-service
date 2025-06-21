const {
    server,
    network_monitoring,
    webhooks,
    discord_bot
} = require('./config');
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const megacmd = require('./routes/megacmd');
const plex = require('./routes/plex');
const DiscordBot = require('./util/discord_bot');
const { networkMonitor } = require('./util/sysinfo');
const { dayMonthYear, deleteDownloads } = require('./util/common');
const Logging = require('./util/logging');
const { CronJob } = require('cron');
const { bot_script, stdio, detached } = discord_bot;
const { interface, polling_rate_ms } = network_monitoring;

const allowedOrigins = ['http://localhost', `http://${webhooks.plex_server_hostname}:${webhooks.plex_server_port}`];
const corsOptions = {
    origin: function (origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `Origin ${origin} was blocked by CORS policy`;
            return cb(new Error(msg), false);
        }
        console.log(origin);
        return cb(null, true);
    }
}

const logging = new Logging();
const discordBot = new DiscordBot(bot_script, "this", stdio, detached);
const NetworkMonitor = networkMonitor(interface, polling_rate_ms);
let clearDownloadsJob = null;

const app = express();
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

app.use('/api', megacmd);

if (!webhooks.disabled) {
    // use the plex api when webhooks are enabled and start job to clean temp downloads
    app.use('/api', cors(corsOptions), plex);

    clearDownloadsJob = new CronJob(
        server.cron_cleanup,
        async () => {
            try {
                await deleteDownloads('./downloads');
                console.log('Finished running deleteDownloads');
            } catch (error) {
                console.error(error);
            }
        },
        null,
        false,
        server.tz
    );
}

/**
 * Get download_locations labels for the frontend
 */
app.get('/api/options', async (req, res) => {
    try {
        const download_locations = server.download_locations.map(p => p.label);
        return res.json({
            options: {
                outputPathLabels: download_locations
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message});
    }
})

/**
 * Read a log file and send to the browser
 */
app.get('/api/log/:tag', async (req, res) => {
    try {
        const { sortBy = 'time', sortOrder = 'asc', filterByType = 'all', filterBySubtype = 'all' } = req.query;
        const tag = req.params.tag.toLowerCase();
        let dateString = null;
        let getAllLogs = false;
        let logs = [];

        switch (tag) {
            case 'now':
            case 'today': dateString = dayMonthYear(new Date()); break;
            case 'yesterday':
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                dateString = dayMonthYear(yesterday);
                break;
            case 'all': getAllLogs = true; break;
            default:
                const regex = /^\d{2}-\d{2}-\d{4}$/;
                if (regex.test(tag)) {
                    const parts = tag.split('-');
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    const dateobj = new Date(year, month, day);
                    if (dateobj.getFullYear() === year && dateobj.getMonth() === month && dateobj.getDate() === day) {
                        dateString = tag;
                    } else {
                        return res.status(400).json({ error: "Invalid date format or invalid date" });
                    }
                } else {
                    return res.status(400).json({ error: 'Invalid tag, date format or invalid date' });
                }
        }

        if (getAllLogs) {
            logs = await logging.readAll({ sortBy, sortOrder, filterByType, filterBySubtype });
            return res.json(logs);
        } else {
            if (dateString) {
                logs = await logging.read(dateString, { sortBy, sortOrder, filterByType, filterBySubtype });
                return res.json(logs);
            } else {
                return res.status(500).json({ error: 'Could not determine date for log retrieval.' });
            }
        }
    } catch (error) {
        console.error('Error fetching logs: ', error);
        return res.status(500).json({ error: 'Error fetching logs' });
    }
});

/**
 * Get network speed
 * 
 * Browser will poll this endpoint while downloads
 * are going depending on the setting in `config.network_monitoring`
 */
app.get('/api/network/speed', async (req, res) => {
    try {
        if (network_monitoring.disabled) {
            return res.sendStatus(403);
        }
        const speed = NetworkMonitor.latestSpeed;
        if (!speed) throw new Error(`Could not get network speed from the monitor.`);
        return res.status(202).json(speed);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error getting network speed' });
    }
});

/**
 * Serves the main index.html page
 */
app.get('/', (req, res) => {
    try {
        return res.sendFile(path.resolve('./public/index.html'));

    } catch (error) {
        console.error(error);
        return res.send(`<html><body><h1>HTTP500</h1><p>An error occurred serving index.html</p><p>${error.message}</p></body></html>`);
    }
});

/**
 * Serves the logs.html page
 */
app.get('/logs', (req, res) => {
    try {
        return res.sendFile(path.resolve('./public/logs.html'));
    } catch (error) {
        console.error(error);
        return res.send(`<html><body><h1>HTTP500</h1><p>An error occurred serving logs.html</p><p>${error.message}</p></body></html>`);
    }
});


const httpServer = http.createServer(app);

const webserver = httpServer.listen(server.port, async () => {
    if (!network_monitoring.disbled) await NetworkMonitor.start(); // start network monitoring
    if (!discord_bot.disabled) discordBot.start();                 // start discord bot
    if (clearDownloadsJob && !webhooks.disabled) clearDownloadsJob.start(); // start cronjob

    console.log(`Server running on port ${server.port}`);
});

webserver.on('close', () => {
    console.log('Server stopped. Stopping network monitor...');
    if (!network_monitoring.disabled) NetworkMonitor.stop();
    if (!discord_bot.disabled) discordBot.stop();
    if (clearDownloadsJob && !webhooks.disabled) clearDownloadsJob.stop();
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    webserver.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    webserver.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});
