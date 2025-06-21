const { spawn } = require('child_process');
const path = require('path');

class DiscordBot {
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
            console.log(`[bot] Bot process (pid: ${this.bot_pid}) exited with code ${code} and signal ${signal}`);
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

    stop () {
        if (!this.bot_process || this.bot_process.killed) {
            console.log('[bot] Bot is not running');
            return;
        }

        console.log(`[bot] Stopping bot process (pid: ${this.bot_pid})`);
        this.bot_process.kill('SIGTERM');
        this.cleanupProcess();
    }

    cleanupProcess() {
        this.bot_process = null;
        this.bot_pid = null;
    }

    isRunning() {
        return this.bot_process !== null && !this.bot_process.killed;
    }
}

module.exports = DiscordBot;