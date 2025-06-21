const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const Logging = require('../util/logging');
const webhooks = require('../util/webhooks');
const {
    plex_server_hostname,
    plex_server_port,
    plex_api_token,
    discord_webhook_url,
    higher_resolution_images,
    test_discord_webhook_url,
    test_capture_latest_payload
} = require('../config.json').webhooks;

let use_test_discord_webhook = false;
const router = express.Router();
const logging = new Logging();
const test_thumb = path.resolve(__dirname, '..', 'test', 'test_thumb.png');

// thumbnails are always sent with the webhook payload,
// download them or else the payload wont be parsed properly
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const download_dir = path.join(__dirname, '..', 'downloads');
        cb(null, download_dir)
    },
    filename: (req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extnesion = path.extname(file.originalname);
        const filename = file.fieldname + '-' + suffix + extnesion;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.post('/plex', upload.single('thumb'), async (req, res) => {
    try {
        // check if this request is from the test script
        if (typeof req.body.use_test_discord_webhook !== 'undefined') {
            use_test_discord_webhook = true;
        }

        const payload = JSON.parse(req.body.payload);
        // if (test_capture_latest_payload) {
        //     fs.writeFile(path.join(__dirname, '..', 'test', `${payload.event}.json`), JSON.stringify(payload), err => {
        //         if (err) console.error(`Error writing test payload: `, err);
        //     });
        // }

        if (test_capture_latest_payload)
            await webhooks.capturePayload(payload);

        // only checking for library.new for now
        if (payload.event !== "library.new") return res.sendStatus(403);

        const {
            type,
            librarySection,
            title,
            originallyAvailableAt,
            summary,
            contentRating,
            audienceRating,
            color,
            genres,
            item_urls,
            thumb,
            tagline,
            event
        } = webhooks.getDataFromPlexPayload(payload);

        // ignore music for now
        if (type === 'music') return res.sendStatus(200);

        let itemPublicUrl = "";
        switch (type) {
            case "show": itemPublicUrl = item_urls.tvdb; break;
            case "movie": itemPublicUrl = item_urls.imdb; break;
            default: itemPublicUrl = item_urls.imdb;
        }

        const imgUrl = `http://${plex_server_hostname}:${plex_server_port}${thumb}`;
        const imageName = `${uuid.v4()}.jpg`;
        const imagePath = path.join(__dirname, '..', 'downloads', imageName);
        let imgDownloaded = false;

        // download higher res image from plex server
        if (higher_resolution_images) {
            try {
                const thumbExists = fs.existsSync(imagePath);
                if (!thumbExists) {
                    const imageRes = await axios({
                        url: imgUrl,
                        method: 'GET',
                        responseType: 'stream',
                        headers: {
                            "X-Plex-Token": plex_api_token
                        }
                    });

                    const writer = fs.createWriteStream(imagePath);
                    imageRes.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', () => {
                            console.log('downloaded image');
                            imgDownloaded = true;
                            resolve();
                        });

                        writer.on('error', (err) => {
                            console.error(err);
                            reject(new Error(err));
                        });
                    });
                } else {
                    // thumb exists
                    imgDownloaded = true;
                }
            } catch (error) {
                console.error('error downloading hires image: ', error);
                logging.write('webhook', false, { error: error.message });
            }
        }

        // start building discord message payload
        let message = {
            "content": `🆕 ${title} was added to gserver`,
            "embeds": [
                {
                    "title": title,
                    "description": summary,
                    "url": itemPublicUrl,
                    "color": color,
                    "author": {
                        "name": `New ${type} added to ${librarySection} 🍿`
                    },
                    "fields": [
                        {
                            "name": "Audience Rating",
                            "value": `${audienceRating}/10`,
                            "inline": true
                        },
                        {
                            "name": "Originally Available",
                            "value": originallyAvailableAt,
                            "inline": true
                        },
                        {
                            "name": "Genres",
                            "value": genres.join(', ')
                        },
                        {
                            "name": "Rating",
                            "value": contentRating,
                            "inline": true
                        }
                    ]
                }
            ]
        }

        const form = new FormData();

        // add tagline from plex payload to message if exists
        if (tagline) {
            message.embeds[0]['footer'] = { "text": `"${tagline}"` };
        }

        // add in image to the message and formdata if it exists
        // use either provided thumbnail image or downloaded hires image.
        // use test thumbnail when test event is sent instead.
        if (higher_resolution_images) {
            if (use_test_discord_webhook) {
                form.append('file', fs.createReadStream(test_thumb), 'test_thumb.png');
                message.embeds[0]['image'] = { "url": `attachment://test_thumb.png` };
            } else {
                if (imgDownloaded) {
                    form.append('file', fs.createReadStream(imagePath), imageName);
                    message.embeds[0]['image'] = { "url": `attachment://${imageName}` };
                }
            }
        } else {
            if (use_test_discord_webhook) {
                form.append('file', fs.createReadStream(test_thumb), 'test_thumb.png');
                message.embeds[0]['thumbnail'] = { "url": `attachment://test_thumb.png` };
            } else {
                let thumbPath = req.file.path;
                let thumbName = req.file.filename;
                form.append('file', fs.createReadStream(thumbPath), thumbName);
                message.embeds[0]['thumbnail'] = { "url": `attachment://${thumbName}` };
            }
        }

        form.append('payload_json', JSON.stringify(message));

        // send message to discord webhook url
        try {
            console.log("test webhook? ", use_test_discord_webhook);
            await axios.post(
                use_test_discord_webhook ? test_discord_webhook_url : discord_webhook_url,
                form, {
                headers: {
                    ...form.getHeaders()
                }
            });
        } catch (error) {
            throw new Error(`Error sending to Discord webhook: ${error.message}\nFailed embed: ${JSON.stringify(message)}`);
        }

        logging.write('webhook', true, { msg: `Successfully sent discord webhook from plex event '${event}'`, temp_files: [req.file?.filename, imageName] });

        return res.sendStatus(200);
    } catch (error) {
        if (error.response) {
            console.error(error.message);
            console.error(error.response.code);
            logging.write('webhook', false, { error: error.message, httpCode: error.response.code });
            return res.sendStatus(500);
        }

        console.error(error.message);
        logging.write('webhook', false, { error: error.message });
        return res.sendStatus(500);
    }
});

module.exports = router;