const express = require('express');
const Logging = require('../util/logging');
const router = express.Router();
const { queue, transfers, setTransferState } = require('../util/megacmd');
const { server } = require('../config.js');
const logging = new Logging();

router.post('/queue', async (req, res) => {
    const { url_arr, outputPathLabel } = req.body;
    try {
        if (!Array.isArray(url_arr)) throw new Error(`url_arr is not an Array`);
        if (Array.isArray(url_arr) && url_arr.length <= 0) throw new Error(`url_arr is empty`);
        let outputPath = "";
        
        for (let p of server.download_locations) {
            if (p.label === outputPathLabel) {
                outputPath = p.path;
                break;
            }
        }

        if (outputPath.length === 0) {
            console.error(`Label "${outputPathLabel}" is not in config.json`);
            await logging.write("queue", false, {error: `Label "${outputPathLabel}" did not match the config.json.download_locations list.`});
            return res.status(500).json({success: false});
        }

        let results = {
            successful_queues: [],
            unsuccessful_queues: []
        };
        for (const url of url_arr) {
            try {
                const result = await queue(url, outputPath);
                await logging.write('queue', true, {
                    url: url,
                    outputPath: outputPath
                });

                results.successful_queues.push({
                    url: url,
                    message: result.stdout
                });
            } catch (err) {
                console.error(`Error queueing: `, err);
                await logging.write('queue', false, {
                    error: err.message
                });

                results.unsuccessful_queues.push({
                    url: url,
                    message: err.message
                });
            }
        }

        return res.json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false, error: error.message});
    }
});

router.post('/pauseAll', async (req, res) => {
    try {
        const {stdout, stderr, code} = await setTransferState("pause");
        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/resumeAll', async (req, res) => {
    try {
        const {stdout, stderr, code} = await setTransferState("resume");
        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/cancelAll', async (req, res) => {
    try {
        const {stdout, stderr, code} = await setTransferState("cancel");
        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/pause/:tag_number', async (req, res) => {
    try {
        const { tag_number } = req.params;

        const { stdout, stderr, code } = await setTransferState("pause", false, tag_number);
        if (code > 0 && stderr) throw new Error(`mega-transfers -p ${tag_number} failed without throwing. Error code ${code}. stderr: ${stderr}. stdout: ${stdout}`);

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/resume/:tag_number', async (req, res) => {
    try {
        const { tag_number } = req.params;

        const { stdout, stderr, code } = await setTransferState("resume", false, tag_number);
        if (code > 0 && stderr) throw new Error(`mega-transfers -r ${tag_number} failed without throwing. Error code ${code}. stderr: ${stderr}. stdout: ${stdout}`);

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/cancel/:tag_number', async (req, res) => {
    try {
        const { tag_number } = req.params;

        const { stdout, stderr, code } = await setTransferState("cancel", false, tag_number);
        if (code > 0 && stderr) throw new Error(`mega-transfers -c ${tag_number} failed without throwing. Error code ${code}. stderr: ${stderr}. stdout: ${stdout}`);

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.get('/transfers', async (req, res) => {
    try {
        const { limit } = req.query;
        const { results, stderr, code } = await transfers(limit);

        if (code > 0 && stderr) throw new Error(`mega-transfers failed without throwing. Error code ${code}. stderr: ${stderr}`);

        return res.json(results);

    } catch (error) {
        console.error(error);
        return res.status(500);
    }
});

module.exports = router;