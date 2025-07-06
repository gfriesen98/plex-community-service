import createConfig from "./util/config.jsdoc.js";

export default createConfig({
    server: {
        // Required. Your timezone (e.g., "America/Chicago").
        tz: "America/New_York",
        // Optional. The webserver port. Defaults to 3000.
        port: 3000,
        // Optional. CRON syntax for cleanup. Defaults to "0 4 * * * ".
        cron_cleanup: "0 4 * * *",
        // Required. A list of download locations. Must contain at least one.
        download_locations: [
            {
                // Optional. Frontend display name. Defaults to "Downloads".
                label: "Primary Downloads",
                // Optional. Download directory path. Defaults to "./downloads".
                path: "/mnt/data/downloads",
            },
        ],
    },
    network_monitoring: {
        // Optional. Set to true to disable. Defaults to false.
        disabled: false,
        // Required if monitoring is enabled. The network interface to monitor (e.g., "eth0").
        network_interface: "enp0s4",
        // Optional. How often to poll in ms. Defaults to 1000.
        polling_rate_ms: 1000,
    },
    webhooks: {
        // Optional. Set to true to disable. Defaults to false.
        disabled: false,
        // Required if webhooks are enabled. Your Plex server's IP or hostname.
        plex_server_hostname: "192.168.1.10",
        // Optional. Your Plex server's port. Defaults to 32400.
        plex_server_port: 32400,
        // Required if webhooks are enabled. Your Plex API token.
        plex_api_token: "YOUR_PLEX_TOKEN",
        // Required if webhooks are enabled. The Discord webhook URL for notifications.
        discord_webhook_url: "https://discord.com/api/webhooks/...",
        // Optional. A separate Discord webhook URL for testing.
        test_discord_webhook_url: "",
        // Optional. Use high-res images from Plex. Defaults to true.
        higher_resolution_images: true,
        // Optional. For development, captures Plex payloads. Defaults to false.
        test_capture_latest_payload: false,
    },
    discord_bot: {
        // Optional. Set to true to disable the bot. Defaults to false.
        disabled: false,
        // Optional. Path to bot entry point. Defaults to "./discord_bot/index.js".
        bot_script: "./discord_bot/index.js",
        // Optional. Child process stdio handling. Defaults to "inherit".
        stdio: "inherit",
        // Optional. Run the bot as a detached process. Defaults to true.
        detached: true,
        // Required if bot is enabled. Contains the bot's specific settings.
        config: {
            // Required if bot is enabled. Your Discord bot's token.
            token: "YOUR_DISCORD_BOT_TOKEN",
            // Required if bot is enabled. The bot's client ID.
            client_id: "YOUR_BOT_CLIENT_ID",
            // Required if bot is enabled. Your Discord server (guild) ID.
            guild_id: "YOUR_DISCORD_SERVER_ID",
            // Optional. Transforms user requests into a url using a template. Set to false to disable.
            //           Example: https://google.com?q={query}
            //                    "{query}" is replaced by the users request
            request_url_template: false,
            // Optional. The command prefix for the bot. Defaults to "!".
            prefix: "!",
            // Required if bot is enabled. Settings for reaction-based role assignment.
            rules: {
                // Required if bot is enabled. The ID of the message to react to for roles.
                rules_message_id: "MESSAGE_ID_OF_RULES_POST",
                // Optional. The emoji for the reaction role. Defaults to "❤️".
                rules_reaction_emoji_name: "❤️",
                // Required if bot is enabled. A list of roles to assign upon reaction.
                roles_id: [
                    {
                        // Required. A descriptive name for the role.
                        name: "Member",
                        // Required. The Discord role ID to assign.
                        id: "ROLE_ID_TO_ASSIGN",
                    },
                ],
            },
            // Required if bot is enabled. Channel-specific settings.
            channels: {
                // Required if bot is enabled. The channel ID for request notifications.
                requests: "CHANNEL_ID_FOR_REQUESTS",
            },
        },
    },
});