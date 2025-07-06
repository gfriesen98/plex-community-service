const fs = require('fs');
const path = require('path');
const Logging = require('./logging');
const uuid = require('uuid');
const { default: axios } = require('axios');
const { plex_api_token, plex_server_hostname, plex_server_port } = require('../config').webhooks;
const logging = new Logging();

function getDataFromPlexPayload(payload) {
    return {
        type: payload.Metadata.type,
        librarySection: payload.Metadata.librarySectionTitle,
        title: payload.Metadata.title,
        originallyAvailableAt: payload.Metadata.originallyAvailableAt,
        summary: payload.Metadata.summary,
        contentRating: payload.Metadata.contentRating,
        audienceRating: payload.Metadata.audienceRating,
        color: getColorDecimal(payload),
        genres: payload.Metadata.Genre.map(g => g.tag),
        item_urls: getGuidUrls(payload),
        thumb: payload.Metadata.thumb,
        tagline: payload.Metadata.tagline,
        event: payload.event
    };
}

function getColorDecimal(payload) {
    return parseInt(payload.Metadata.UltraBlurColors.topLeft, 16);
}

function getGuidUrls(payload) {
    let obj = {
        imdb: "",
        tmdb: "",
        tvdb: ""
    };

    for (const guid of payload.Metadata.Guid) {
        if (guid.id.startsWith("imdb://")) {
            let g = guid.id.replace("imdb://", "");
            obj.imdb = `https://www.imdb.com/title/${g}`
        } else if (guid.id.startsWith("tmdb://")) {
            let g = guid.id.replace("tmdb://", "");
            obj.tmdb = "idk what the url is right now"
        } else if (guid.id.startsWith("tvdb://")) {
            let g = guid.id.replace("tvdb://", "");
            obj.tvdb = `https://thetvdb.com/dereferrer/series/${g}`;
        } else {

        }
    }

    return obj;
}

/**
 * Captures a plex event and saves it to './test' named `[event name].json`
 * @param {Object} payload req.body.payload object
 * @returns {boolean} success/fail
 */
async function capturePayload(payload) {
    try {
        const name = path.join(__dirname, '..', 'test', `${payload.event}.json`);
        await fs.promises.writeFile(name, JSON.stringify(payload), 'utf-8');
        return true;
    } catch (error) {
        console.error(error);
        await logging.write('webhook.capturepayload', false, { message: error.message });
        return false;
    }
}

class DiscordWebhook {
    constructor(payload) {
        this.payload = this.#parsePlexPayload(payload);
    }

    #parsePlexPayload(payload) {
        return {
            type: payload.Metadata.type,
            librarySection: payload.Metadata.librarySectionTitle,
            title: payload.Metadata.title,
            originallyAvailableAt: payload.Metadata.originallyAvailableAt,
            summary: payload.Metadata.summary,
            contentRating: payload.Metadata.contentRating,
            audienceRating: payload.Metadata.audienceRating,
            color: this.getColorDecimals(payload),
            genres: payload.Metadata.Genre.map(g => g.tag),
            item_urls: getGuidUrls(payload),
            thumb: payload.Metadata.thumb,
            tagline: payload.Metadata.tagline,
            event: payload.event
        };
    }

    getRatingUrl() {
        if (this.payload.type === "music") return;
        switch (this.payload.type) {
            case "show": return this.payload.item_urls.tvdb;
            case "movie": return this.payload.item_urls.imdb;
            default: return this.payload.item_urls.imdb;
        }
    }

    async getHiresImage() {
        const img_url = `http://${plex_server_hostname}:${plex_server_hostname}${this.payload.thumb}`;
        const img_name = `${uuid.v4()}.jpg`;
        const img_path = path.join(__dirname, '..', 'thumbnails', img_name);
        let img_downloaded = false;

        const img_exists = fs.existsSync(img_path);

        if (img_exists) return { img_name, img_path }

        try {
            const res = await axios({
                url: img_url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    "X-Plex-Token": plex_api_token
                }
            });

            const writer = fs.createWriteStream(img_path);
            res.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    img_downloaded = true;
                    resolve();
                });

                writer.on('error', error => {
                    reject(new Error(error));
                });
            });

            return { img_name, img_path };
        } catch (error) {
            console.error(error);
        }
    }

    getColorDecimals(payload) {
        return {
            topLeft: parseInt(payload.Metadata.UltraBlurColors.topLeft, 16),
            topRight: parseInt(payload.Metadata.UltraBlurColors.topRight, 16),
            bottomLeft: parseInt(payload.Metadata.UltraBlurColors.bottomLeft, 16),
            bottomRight: parseInt(payload.Metadata.UltraBlurColors.bottomRight, 16)
        }
    }

    messageBuilder() {
        
    }
}

module.exports = {
    getDataFromPlexPayload,
    capturePayload,
    DiscordWebhook
}