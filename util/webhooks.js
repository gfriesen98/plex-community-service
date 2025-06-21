const fs = require('fs');
const path = require('path');
const Logging = require('./logging');
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

async function capturePayload(payload) {
    try {
        const name = path.join(__dirname, '..', 'test', `${payload.event}.json`);
        fs.writeFile(name, JSON.stringify(payload), (err) => {
            if (err) throw new Error(`Error capturing plex payload: ${err}`);
        });
        return true;
    } catch (error) {
        console.error(error);
        await logging.write('webhook.capturepayload', false, {message: error.message});
        return false;
    }
}

module.exports = {
    getDataFromPlexPayload,
    capturePayload
}