import { spawn } from 'child_process';
import path from 'path';

export default class DiscordBot {
    /**
     * Create a new subprocess for a discord bot
     * @param {string} script_path Path to the bot entrypoint script.
     * @param {string} execPath Path to the executable, such as node, python, etc. Set to '"this"' by default, which resolves to `process.execPath`
     * @param {string} stdio  Options of `pipe | overlapped | ipc | ignore | inherit`. Default set to `inherit`
     * @param {boolean} detached Run process independantly of this parent process. Default set to 'true'
     */
    constructor (script_path, execPath = "this", stdio = 'inherit', detached = true) {
        this.script_path = script_path;
        this.execPath = execPath === "this" ? process.execPath : execPath;
        this.cwd = path.dirname(script_path);
        this.stdio = stdio;
        this.bot_process = null;
        this.bot_pid = null;
        this.detached = detached;
    }

    /**
     * Start the child process
     * @returns 
     */
    start() {
        console.log(this);
        if (this.bot_process && !this.bot_process.killed) {
            console.log('[bot] Bot is already running');
            return null;
        }

        // const node_path = process.execPath;

        const options = {
            cwd: this.cwd,
            stdio: this.stdio,
            detached: this.detached
        };

        console.log('[bot] Starting discord bot script');
        this.bot_process = spawn(this.execPath, [path.basename(this.script_path)], options);
        this.bot_pid = this.bot_process.pid;
        console.log(`[bot] Started discord bot (pid: ${this.bot_pid})`);

        this.bot_process.on('error', err => {
            console.error(`[bot] Error starting bot process:`, err);
            this.cleanupProcess();
        });

        this.bot_process.on('exit', (code, signal) => {
            console.log(`[bot] Bot process (pid: ${this.bot_pid}) exited with signal ${signal}`);
            this.cleanupProcess()
        });

        if (this.stdio !== 'inherit') {
            this.bot_process.stdout.on('data', (data) => {
                console.log(`[bot] ${data}`);
            });

            this.bot_process.stderr.on('data', (data) => {
                console.error(`[bot] ${data}`);
            });
        }
    }

    async stop () {
        if (!this.bot_process || this.bot_process.killed) {
            console.log('[bot] Bot is not running');
            return;
        }

        console.log(`[bot] Stopping bot process (pid: ${this.bot_pid})`);
        this.bot_process.kill('SIGTERM');
        // this.cleanupProcess();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.bot_process && !this.bot_process.killed) {
                    console.warn(`[bot] Bot process (pid: ${this.bot_pid}) did not respond to SIGTERM. Sending SIGKILL...`);
                    this.bot_process.kill("SIGKILL");
                }
                resolve();
            }, 5000);

            this.bot_process.once('exit', (code, signal) => {
                clearTimeout(timeout);
                console.log(`[bot] Bot process (pid: ${this.bot_pid}) confirmed exit after stop signal.`);
                resolve();
            });

            this.bot_process.once('error', err => {
                clearTimeout(timeout);
                console.error(`[bot] Error trying to kill the bot (pid: ${this.bot_pid}): `, err);
                resolve();
            });
        });
    }

    cleanupProcess() {
        if (this.bot_process) {
            this.bot_process.removeAllListeners();
        }
        this.bot_process = null;
        this.bot_pid = null;
    }

    isRunning() {
        return this.bot_process !== null && this.bot_pid !== null;
    }
}

// module.exports = DiscordBot;