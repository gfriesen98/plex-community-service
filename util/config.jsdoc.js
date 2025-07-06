/**
 * @typedef {object} download_location
 * @property {string} [label="Downloads"] - The frontend display name.
 * @property {string} [path="./downloads"] - The path you want mega.nz downloads saved.
 */

/**
 * @typedef {object} server_config
 * @property {number} [port=3000] - The webserver port.
 * @property {string} tz - REQUIRED. Your timezone. Example: America/Chicago.
 * @property {download_location[]} download_locations - A list of download locations served to the front end.
 * @property {string} [cron_cleanup="0 4 * * * "] - Interval to delete files in ./download. Uses CRON syntax.
 */

/**
 * @typedef {object} network_monitor_config
 * @property {boolean} [disabled=false] - Set to 'true' to disable monitoring.
 * @property {string} network_interface - REQUIRED. Network interface name. Required when monitoring is enabled.
 * @property {number} [polling_rate_ms=1000] - How often the service polls for changes in milliseconds.
 */

/**
 * @typedef {object} webhooks_config
 * @property {boolean} [disabled=false] - Set to 'true' to disable Plex webhook functionality.
 * @property {boolean} [higher_resolution_images=true] - Download higher resolution images from your server. REQUIRES plex_api_token to be set.
 * @property {string} plex_server_hostname - REQUIRED. Your local Plex server hostname or IP address.
 * @property {number} [plex_server_port=32400] - Plex port.
 * @property {string} plex_api_token - REQUIRED. Plex API token.
 * @property {string} discord_webhook_url - REQUIRED. Your Discord webhook URL.
 * @property {string} [test_discord_webhook_url] - Another Discord webhook URL for sending test messages. Leave empty if not used.
 * @property {boolean} [test_capture_latest_payload=false] - Capture Plex payloads for testing purposes.
 */

/**
 * @typedef {object} discord_role
 * @property {string} name - REQUIRED. Name of the role.
 * @property {string} id - REQUIRED. The role's ID.
 */

/**
 * @typedef {object} discord_bot_rules_config
 * @property {string} rules_message_id - REQUIRED. The message ID of the rules message.
 * @property {string} [rules_reaction_emoji_name="❤️"] - The emoji reaction expected on the rules message.
 * @property {discord_role[]} roles_id - REQUIRED. A list of roles to assign to the user.
 */

/**
 * @typedef {object} discord_bot_channels_config
 * @property {string} requests - REQUIRED. Channel ID to send /request command notifications to.
 */

/**
 * @typedef {object} discord_bot_inner_config
 * @property {string} token - REQUIRED. Discord bot token.
 * @property {string} client_id - REQUIRED. Discord bot client ID.
 * @property {string} guild_id - REQUIRED. Discord server ID.
 * @property {string} [prefix="!"] - Text command prefix.
 * @property {string|false} [request_url_template=false] - URL template for the /request command. This will take incoming requests and transform them into a search query for a specific site. Example: `https://google.com?q={query}`. Set to `false` to disable.
 * @property {discord_bot_rules_config} rules - Configuration for role assignment via reactions.
 * @property {discord_bot_channels_config} channels - Configuration for special channels.
 */

/**
 * @typedef {object} discord_bot_config
 * @property {boolean} [disabled=false] - Set this to 'true' to disable the bot entirely.
 * @property {string} [bot_script="./discord_bot/index.js"] - Path to the bot script entry point. Do not change unless you have your own DiscordJS bot entry point.
 * @property {string} [stdio="inherit"] - Set to 'inherit' to redirect output to the same process.
 * @property {boolean} [detached=true] - Set to 'true' to detach the process.
 * @property {discord_bot_inner_config} config - The specific configuration for the Discord bot's logic.
 */

/**
 * @typedef {object} config
 * @property {server_config} server - Web server settings.
 * @property {network_monitor_config} network_monitoring - Network monitoring settings. Display a readout of upload/download on your network adapter
 * @property {webhooks_config} webhooks - Plex and Discord webhook settings.
 * @property {discord_bot_config} discord_bot - Discord bot integration settings.
 */

/**
 * Validates a required property on an object.
 * @param {object} obj The object to check.
 * @param {string} key The property key to validate.
 * @param {string} path The configuration path for error messages.
 */
function validateRequired(obj, key, path) {
    if (obj[key] === null || obj[key] === undefined || obj[key] === "") {
        throw new Error(`Configuration error: ${path}.${key} is required.`);
    }
}

/**
 * Creates, validates, and applies defaults to a configuration object.
 * @param {Partial<config>} userConfig - The user-provided configuration object.
 * @returns {config} The validated configuration object with defaults applied.
 * @throws {Error} if the configuration is invalid.
 */
export default function createConfig(userConfig) {
    if (!userConfig) {
        throw new Error("Configuration object is missing.");
    }

    // Create a deep copy to avoid mutating the original object
    const config = JSON.parse(JSON.stringify(userConfig));

    // --- Apply Defaults ---
    const { server, network_monitoring, webhooks, discord_bot } = config;

    // Ensure top-level objects exist
    config.server = server || {};
    config.network_monitoring = network_monitoring || {};
    config.webhooks = webhooks || {};
    config.discord_bot = discord_bot || {};

    // Server defaults
    config.server.port = config.server.port ?? 3000;
    config.server.cron_cleanup = config.server.cron_cleanup ?? "0 4 * * * ";
    config.server.download_locations = config.server.download_locations ?? [];
    config.server.download_locations.forEach((loc) => {
        loc.label = loc.label ?? "Downloads";
        loc.path = loc.path ?? "./downloads";
    });

    // Network Monitoring defaults
    config.network_monitoring.disabled = config.network_monitoring.disabled ?? false;
    config.network_monitoring.polling_rate_ms = config.network_monitoring.polling_rate_ms ?? 1000;

    // Webhooks defaults
    config.webhooks.disabled = config.webhooks.disabled ?? false;
    config.webhooks.higher_resolution_images = config.webhooks.higher_resolution_images ?? true;
    config.webhooks.plex_server_port = config.webhooks.plex_server_port ?? 32400;
    config.webhooks.test_capture_latest_payload = config.webhooks.test_capture_latest_payload ?? false;

    // Discord Bot defaults
    config.discord_bot.disabled = config.discord_bot.disabled ?? false;
    config.discord_bot.bot_script = config.discord_bot.bot_script ?? "./neo-gortbot/index.js";
    config.discord_bot.stdio = config.discord_bot.stdio ?? "inherit";
    config.discord_bot.detached = config.discord_bot.detached ?? true;
    config.discord_bot.config = config.discord_bot.config || {};
    config.discord_bot.config.request_url_template = config.discord_bot.config.request_url_template ?? false;
    config.discord_bot.config.prefix = config.discord_bot.config.prefix ?? "!";
    config.discord_bot.config.rules = config.discord_bot.config.rules || {};
    config.discord_bot.config.rules.rules_reaction_emoji_name = config.discord_bot.config.rules.rules_reaction_emoji_name ?? "❤️";

    // --- Validation (on the config object with defaults) ---
    validateRequired(config.server, "tz", "server");
    if (config.server.download_locations.length === 0) {
        // If user provides empty array, that's fine, but if it was defaulted, it's an issue.
        // Let's assume at least one is required if the feature is used.
        // This validation can be adjusted based on actual requirements.
        console.warn("Warning: server.download_locations is empty.");
    }

    if (config.network_monitoring.disabled !== true) {
        validateRequired(config.network_monitoring, "network_interface", "network_monitoring");
    }

    if (config.webhooks.disabled !== true) {
        validateRequired(config.webhooks, "plex_server_hostname", "webhooks");
        validateRequired(config.webhooks, "plex_api_token", "webhooks");
        validateRequired(config.webhooks, "discord_webhook_url", "webhooks");
    }

    if (config.discord_bot.disabled !== true) {
        const botConfig = config.discord_bot.config;
        const botPath = "discord_bot.config";
        validateRequired(botConfig, "token", botPath);
        validateRequired(botConfig, "client_id", botPath);
        validateRequired(botConfig, "guild_id", botPath);

        const rules = botConfig.rules;
        if (!rules) throw new Error(`Configuration error: ${botPath}.rules is missing.`);
        const rulesPath = `${botPath}.rules`;
        validateRequired(rules, "rules_message_id", rulesPath);
        if (!Array.isArray(rules.roles_id) || rules.roles_id.length === 0) {
            throw new Error(`Configuration error: ${rulesPath}.roles_id must be a non-empty array.`);
        }
        rules.roles_id.forEach((role, i) => {
            const rolePath = `${rulesPath}.roles_id[${i}]`;
            validateRequired(role, "name", rolePath);
            validateRequired(role, "id", rolePath);
        });

        const channels = botConfig.channels;
        if (!channels) throw new Error(`Configuration error: ${botPath}.channels is missing.`);
        validateRequired(channels, "requests", `${botPath}.channels`);
    }

    return config;
}

// module.exports = createConfig;