const { spawn } = require('child_process');
const path = require('path');

/**
 * Parses mega-transfers output into an array of objects.
 * @param {string} text - The output from mega-transfers.
 * @returns {Object} - Array of transfer objects.
 */
function parseMegaTransfers(text) {
    let all_downloads_paused = false; // mega-cmd quirk, if a single transfer is paused, and you do "resume ALL" transfers, that single transfer wont be unpaused. this variable is to help the frontend let the user know this is a thing

    // Split into lines and trim right-side whitespace
    const lines = text
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0);

    // Remove "DOWNLOADS AND UPLOADS ARE PAUSED" if present
    // this text only shows up when -a -p flags are used to pause all transfers
    // also, for some reason, transfer status will still show as ACTIVE (not PAUSED)
    if (lines.length > 0 && lines[0].toUpperCase().includes('DOWNLOADS AND UPLOADS ARE PAUSED')) {
        lines.shift();
        all_downloads_paused = true;
    }

    // Find the header line (starts with TYPE)
    const headerIdx = lines.findIndex((l) => l.startsWith('TYPE'));
    if (headerIdx === -1 || headerIdx + 1 >= lines.length) return [];

    const headerLine = lines[headerIdx];
    const dataLines = lines.slice(headerIdx + 1);

    // Find column start positions by header
    const columns = [
        { key: 'type', label: 'TYPE' },
        { key: 'tag', label: 'TAG' },
        { key: 'sourcePath', label: 'SOURCEPATH' },
        { key: 'destinyPath', label: 'DESTINYPATH' },
        { key: 'progress', label: 'PROGRESS' },
        { key: 'state', label: 'STATE' },
    ];

    // Get start positions for each column
    const colPositions = columns.map((col) => headerLine.indexOf(col.label));
    // Add an end position for the last column
    colPositions.push(undefined);

    // Parse each data line
    const json = [];
    for (const line of dataLines) {
        // Skip lines that are not data (e.g., empty or separator lines)
        if (!line.trim() || line.startsWith('-')) continue;

        const obj = {};
        for (let i = 0; i < columns.length; i++) {
            const start = colPositions[i];
            const end = colPositions[i + 1];
            const data = line.slice(start, end).trim().replace(/\s+/g, ' ');

            if (columns[i].key === 'progress') {
                const match = data.match(/([\d.]+)%\s+of\s+(.+)/i); // parse percentage and file size (format: "0% of 5.0 GB")
                if (!match) {
                    obj[columns[i].key] = {
                        text: data,
                        error: 'Could not successfully parse line data for percentage and file size',
                        percent: 0,
                        size: "ERR"
                    }
                } else {
                    obj[columns[i].key] = {
                        text: data,
                        percent: parseFloat(match[1]),
                        size: match[2].trim()
                    };
                }
            } else if (columns[i].key === 'tag') {
                obj[columns[i].key] = {
                    text: data,
                    number: parseInt(data) ?? null
                }
            } else if (columns[i].key === 'destinyPath') {
                obj[columns[i].key] = {
                    text: data,
                    filename: path.basename(data) || ''
                }
            } else if (columns[i].key === 'state') {
                obj[columns[i].key] = {
                    text: data,
                }
            } else {
                obj[columns[i].key] = { text: data };
            }
        }
        obj['id'] = json.length ?? 0;
        json.push(obj);
    }

    return {
        json,
        all_downloads_paused
    }
}

/**
 * Set trasnfer state.
 * 
 * Pause, resume, cancel all or single transfers by tag number
 * 
 * @param {'pause'|'resume'|'cancel'} action The action to set transfer state `pause|resume|cancel`
 * @param {boolean} all Set all transfers state. Default `true`
 * @param {number|string} tag_number Set state of specific transfer by tag number from the TAG column of the output. Set `all` to `false`
 * @returns {Promise<any>} Resolves with `{stdout, stderr, code}`. rejects with `new Error()`
 */
async function setTransferState(action = "pause", all = true, tag_number) {
    return new Promise((resolve, reject) => {
        let arguments = [];
        switch (action) {
            case "pause": arguments.push('-p'); break;
            case "resume": arguments.push('-r'); break;
            case "cancel": arguments.push('-c'); break;
            default: reject(new Error(`Action ${action} does not exist!`));
        }

        if (all) {
            arguments.push('-a');
        } else if (!all && typeof tag_number !== 'undefined') { // allowing tag_number to be represented as either a string or a number (hopefully)
            let n = '';
            if (typeof tag_number === 'number') {
                n = tag_number.toString();
            } else if (typeof tag_number === 'string' && !Number.isNaN(parseInt(tag_number))) {
                n = tag_number;
            } else {
                reject(new Error(`Argument 'tag_number' is not a number. Value: ${tag_number}`));
            }

            arguments.push(n);
        }

        const proc = spawn(`mega-transfers`, arguments);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout: stdout.replaceAll('\n', '').replace('Upload transfers paused successfully.', ''), stderr, code });
            } else reject(new Error(`'mega-transfers ${arguments.join(" ")}' exited with code ${code}\n${stderr || stdout}`));
        });
    });
}

/**
 * Get all running download transfers
 * 
 * Resolves with json representation of `mega-transfers --only-downloads`. Rejects with `new Error()`
 * 
 * @param {number} limit Set to limit how many lines returned from mega-transfers. Default is '0' for unlimited
 * @returns {Promise<{results: { json: Array<object>, all_downloads_paused: boolean }, stderr: string, code: number}>}
 */
async function transfers(limit=0) {
    return new Promise((resolve, reject) => {
        const proc = spawn('mega-transfers', [
            '--only-downloads',
            `--limit=${limit > 0 ? limit : 999}`,
            '--path-display-size=999'
            // `--path-display-size=${pathDisplaySize > 0 ? pathDisplaySize : 999}`]);
        ]);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                let results = parseMegaTransfers(stdout);
                resolve({ results, stderr, code });
            } else reject(new Error(`mega-transfers exited with code ${code}\n${stderr || stdout}`));
        });

    });
}

/**
 * Queues a mega.nz/.io url to a directory
 * @param {string} url mega url to download
 * @param {string} outputPath path to download to
 * @returns {Promise<Object>}
 */
async function queue(url, outputPath) {
    return new Promise((resolve, reject) => {
        const proc = spawn('mega-get', ['-q', url, outputPath]);

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject(new Error(`mega-get exited with code ${code}\nstderr/out: ${stderr || stdout}`));
            }
        });
    });
}

module.exports = {
    queue,
    transfers,
    setTransferState,
};