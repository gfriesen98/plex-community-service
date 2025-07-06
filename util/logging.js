import fs from 'fs/promises';
import fss from 'fs';
import { dayMonthYear, hoursMinutesSeconds } from './common.js';
import path from 'path';

export default class Logging {
    constructor(channel = 'daily', logDirectory = './logs') {
        this.channel = channel;
        this.logDirectory = path.resolve(logDirectory);
    }

    getLogDirectory() {
        return this.logDirectory;
    }

    writeSync(type, isSuccessful, message) {
        try {
            // Ensure the log directory exists
            fss.mkdirSync(this.logDirectory, { recursive: true });

            const date = new Date();
            const dateString = dayMonthYear(date);

            // Create the log file name
            const logFileName = `${dateString}.json`;
            const logFilePath = path.join(this.logDirectory, logFileName);

            const timeString = hoursMinutesSeconds(date);

            // Format the new log entry object
            let newLogEntry = {
                type: type,
                subtype: isSuccessful ? "success" : "error",
                info: message
            };

            let logData = {};

            try {
                // Try to read the existing log file
                const data = fss.readFileSync(logFilePath, 'utf8');
                // Parse the JSON data, handling potential empty file or invalid JSON
                if (data) {
                    logData = JSON.parse(data);
                    if (typeof logData !== 'object' && logData === null) {
                        // If the file exists but isn't an array, start fresh (or handle error)
                        console.warn(`Log file ${logFilePath} does not contain a JSON object. Starting a new log.`);
                        logData = {};
                    }
                }
            } catch (readError) {
                // If the file doesn't exist, this is expected. Other read errors are logged.
                if (readError.code !== 'ENOENT') {
                    console.error(`Error reading log file ${logFilePath}: ${readError}`);
                }
                // If file doesn't exist or has read error, logData remains an empty object
            }

            // Add the new entry to the data
            if (!logData[timeString]) {
                logData[timeString] = [];
            }
            logData[timeString].push(newLogEntry);

            // Write the updated data back to the file with nice formatting
            fss.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');

            console.log(`Successfully wrote to ${logFilePath}`);

        } catch (error) {
            console.error(`Error writing to daily log file: ${error}`);
            // Handle error appropriately in a real application
        }
    }

    async write(type, isSuccessful, message) {
        try {
            // Ensure the log directory exists
            await fs.mkdir(this.logDirectory, { recursive: true });

            const date = new Date();
            const dateString = dayMonthYear(date);

            // Create the log file name
            const logFileName = `${dateString}.json`;
            const logFilePath = path.join(this.logDirectory, logFileName);

            const timeString = hoursMinutesSeconds(date);

            // Format the new log entry object
            let newLogEntry = {
                type: type,
                subtype: isSuccessful ? "success" : "error",
                info: message
            };

            let logData = {};

            try {
                // Try to read the existing log file
                const data = await fs.readFile(logFilePath, 'utf8');
                // Parse the JSON data, handling potential empty file or invalid JSON
                if (data) {
                    logData = JSON.parse(data);
                    if (typeof logData !== 'object' && logData === null) {
                        // If the file exists but isn't an array, start fresh (or handle error)
                        console.warn(`Log file ${logFilePath} does not contain a JSON object. Starting a new log.`);
                        logData = {};
                    }
                }
            } catch (readError) {
                // If the file doesn't exist, this is expected. Other read errors are logged.
                if (readError.code !== 'ENOENT') {
                    console.error(`Error reading log file ${logFilePath}: ${readError}`);
                }
                // If file doesn't exist or has read error, logData remains an empty object
            }

            // Add the new entry to the data
            if (!logData[timeString]) {
                logData[timeString] = [];
            }
            logData[timeString].push(newLogEntry);

            // Write the updated data back to the file with nice formatting
            await fs.writeFile(logFilePath, JSON.stringify(logData, null, 2), 'utf8');

            console.log(`Successfully wrote to ${logFilePath}`);

        } catch (error) {
            console.error(`Error writing to daily log file: ${error}`);
            // Handle error appropriately in a real application
        }
    }

    async read(dateString, options = {}) {
        const { sortBy = 'time', sortOrder = 'asc', filterByType = 'all', filterBySubtype = 'all' } = options;

        const logFileName = `${dateString}.json`;
        const logFilePath = path.join(this.logDirectory, logFileName);

        try {
            const data = await fs.readFile(logFilePath, 'utf8');
            const logData = JSON.parse(data);

            if (typeof logData !== 'object' || logData === null) {
                console.warn(`Log file ${logFilePath} does not contain a valid JSON object`);
                return [];
            }

            let entriesWithTimestamp = [];
            for (const timeString in logData) {
                if (Array.isArray(logData[timeString])) {
                    logData[timeString].forEach(entry => {
                        entriesWithTimestamp.push({ time: timeString, ...entry });
                    });
                }
            }

            if (sortBy === 'time') {
                entriesWithTimestamp.sort((a, b) => {
                    const timeA = new Date(`01/01/2000 ${a.time}`);
                    const timeB = new Date(`01/01/2000 ${b.time}`);
                    if (sortOrder === 'asc') {
                        return timeA - timeB;
                    } else {
                        return timeB - timeA;
                    }
                });
            }

            if (filterByType !== 'all') {
                entriesWithTimestamp = entriesWithTimestamp.filter(d => d.type === filterByType);
            }

            if (filterBySubtype !== 'all') {
                entriesWithTimestamp = entriesWithTimestamp.filter(d => d.subtype === filterBySubtype);
            }

            return entriesWithTimestamp;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Log file not found for date ${dateString}`);
                return [];
            }

            console.error(`Error reading log file ${logFilePath}: ${error}`);
            throw error;
        }
    }

    async readAll(options) {
        const { sortBy = 'time', sortOrder = 'asc', filterByType = 'all', filterBySubtype = 'all' } = options;
        try {
            const files = await fs.readdir(this.logDirectory);
            let entriesWithTimestamp = [];

            for (const file of files) {
                if (path.extname(file).toLowerCase() === '.json') {
                    const filepath = path.join(this.logDirectory, file);

                    try {
                        const fileContent = await fs.readFile(filepath, { encoding: 'utf-8' });

                        const logData = JSON.parse(fileContent);

                        for (const timeString in logData) {
                            if (Array.isArray(logData[timeString])) {
                                logData[timeString].forEach(entry => {
                                    entriesWithTimestamp.push({ time: timeString, ...entry });
                                });
                            }
                        }
                    } catch (error) {
                        console.error("JSON Parse error: ", error);
                    }
                }
            }

            if (sortBy === 'time') {
                entriesWithTimestamp.sort((a, b) => {
                    const ta = new Date(`01/01/2000 ${a.time}`);
                    const tb = new Date(`01/01/2000 ${b.time}`);
                    if (sortOrder === 'asc') {
                        return ta - tb;
                    } else {
                        return tb - ta;
                    }
                });
            }

            if (filterByType !== 'all') {
                entriesWithTimestamp = entriesWithTimestamp.filter(d => d.type === filterByType);
            }

            if (filterBySubtype !== 'all') {
                entriesWithTimestamp = entriesWithTimestamp.filter(d => d.type === filterBySubtype);
            }

            return entriesWithTimestamp;
        } catch (error) {
            console.error('Read error: ', error);
        }
    }
}

// module.exports = Logging;