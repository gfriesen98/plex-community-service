import fs from 'fs/promises';
import path from 'path';

/**
 * Converts bytes to a human-readable string (KB, MB, GB, TB).
 * @param {number} bytesPerSecond - The number of bytes.
 * @param {number} [decimals=2] - The number of decimal places.
 * @returns {string} - The human-readable string.
 */
export function bytesH(bytesPerSecond, decimals = 2) {
    if (bytesPerSecond === 0) return '0 Bytes/s';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i] + '/s';
}

/**
 * Get the date string in DD-MM-YYYY format
 * @param {Date} date Date object. Default is `now`
 */
export function dayMonthYear(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

export function hoursMinutesSeconds(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

export async function deleteDownloads(directoryPath) {
    try {
        await fs.access(directoryPath);
    } catch (error) {
        // await logging.write('job', false, {error: error.message});
        if (error.code === 'ENOENT') {
            console.log('Directory not found');
            return;
        } else {
            console.error('Error accessing ' + directoryPath);
            throw error;
        }
    }

    try {
        const files = await fs.readdir(directoryPath);

        if (files.length === 0) {
            console.log('Directory is empty');
            return;
        }

        const deletePromises = files.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            try {
                const stats = await fs.lstat(filePath);
                if (stats.isDirectory()) {
                    await fs.rm(filePath, { recursive: true });
                } else {
                    await fs.unlink(filePath);
                }
            } catch (error) {
                console.error(`Error deleting ${filePath}: `, error);
            }
        });

        await Promise.all(deletePromises);
        console.log('Finished deleting contents');
        // await logging.write('job', true, {message: "Successfully ran deleteDownloads"});
    } catch (error) {
        console.error(error);
        // await logging.write('job', false, {error: error.message});
    }
}

export function parseDiscordRequestString(markdownString) {
    const result = {
        requestor: null,
        requestDate: null,
        title: null,
        linkText: null,
        linkUrl: null,
    };

    // Split the string into lines for easier processing
    const lines = markdownString.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Regex to remove Discord markdown common to text:
    // **, __, *, _, ||, `
    const stripMarkdown = (text) =>
        text
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold **text**
            .replace(/__(.*?)__/g, '$1')  // Underline __text__
            .replace(/\*(.*?)\*/g, '$1')   // Italic *text*
            .replace(/_(.*?)_/g, '$1')    // Italic _text_
            .replace(/\|\|(.*?)\|\|/g, '$1') // Spoiler ||text||
            .replace(/`(.*?)`/g, '$1')    // Inline code `text`
            .replace(/```.*?```/gs, '')   // Code blocks (multiline, non-greedy)
            .replace(/##\s*/g, ''); // Remove ## from headings (specific to this parse)

    // 1. Parse the header line (e.g., "## Request from username on 17-6-2025")
    const headerLine = lines[0];
    const headerMatch = headerLine.match(/^##\s*Request from\s*(.+?)\s*on\s*(\d{1,2}-\d{1,2}-\d{4})$/i);
    if (headerMatch) {
        result.requestor = headerMatch[1].trim();
        result.requestDate = headerMatch[2].trim();
    }

    // Find the Title and Link lines
    let titleLine = null;
    let linkLine = null;

    // Assuming fixed order, but better to search by content pattern
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) { // Check for bold title format
            titleLine = line;
        } else if (line.startsWith('>') && line.includes('](') && line.endsWith(')')) { // Check for blockquote link format
            linkLine = line;
        }
    }


    // 2. Parse the Title (e.g., "**Title**")
    if (titleLine) {
        result.title = stripMarkdown(titleLine); // strip markdown from the title
    }

    // 3. Parse the Link and Link Text (e.g., "> [link](https://...)")
    if (linkLine) {
        // Remove the leading blockquote "> "
        const cleanLinkLine = linkLine.substring(1).trim();

        const linkMatch = cleanLinkLine.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
            result.linkText = stripMarkdown(linkMatch[1].trim()); // Strip markdown from link text
            result.linkUrl = linkMatch[2].trim();
        }
    }

    return result;
}

// module.exports = {
//     bytesH,
//     dayMonthYear,
//     hoursMinutesSeconds,
//     deleteDownloads,
//     parseDiscordRequestString
// };