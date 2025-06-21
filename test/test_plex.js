const path = require('path');
const { readdirSync } = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

/**
 * This script sends a localhost request to /api/plex to test discord
 * webhook messaging without invoking plex events manually. 
 * Primarily used when changing message styling for different types of events.
 * 
 * Uses the provided [event_name].json files in ./test
 */

// get all the json payloads saved
const events = readdirSync(__dirname, { encoding: 'utf-8' }).filter(n => n.includes('.json')).map(n => n.replace('.json', ''));

function help() {
    console.log(`Usage:     npm run test:plex [plex_event_name]`);
    console.log(`\nOther options:`);
    console.log(`           help    Displays this message`);
    console.log(`           list-events     Lists available plex payload files`);
}

if (process.argv.length < 3) {
    help();
    process.exit(0);
}

if (process.argv[2] === 'help') {
    help();
    process.exit(0);
}

if (process.argv[2].trim() === "list-events") {
    console.log(`Event types:\n${events.join('\n')}`);
    process.exit(0);
}

if (!events.includes(process.argv[2].trim())) {
    console.error(`Error: Event type not recoginized.\nEvent types: ${events.join(", ")}`);
    process.exit(1);
}

let eventType = path.resolve(__dirname, `${process.argv[2].trim()}.json`);

(async () => {
    const formData = new FormData();
    formData.append("use_test_discord_webhook", JSON.stringify({use_test_discord_webhook: true}));

    try {
        const test_payload = require(eventType);
        formData.append('payload', JSON.stringify(test_payload));
        
    } catch (error) {
        console.error(error);
        return null;
    }

    try {
        const stream = fs.createReadStream(path.join(__dirname, 'test_thumb.png'));
        formData.append('thumb', stream);
    } catch (error) {
        console.error(error);
        return null;
    }

    try {
        const res = await axios.post('http://localhost:3000/api/plex', formData, {
            headers: formData.getHeaders()
        });

        console.log("Sent request to /api/plex successfully");
        console.log("Response status:", res.status);
        console.log("Check your discord channel!");
    } catch (error) {
        console.error(error);
    }
})();