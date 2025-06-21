# plex-community-service

A mega-cmd webserver and discord bot all-in-one

This repo ~~is a cursed amalgamation of two projects~~ spins up a frontend for Mega CMD and a discord bot to easily manage your downloads and requests from your users, as well as broadcast Plex updates for them to a Discord server using webhooks. 

## Setup

1. Download and set up Mega CMD. Instructions in the below sections. You need to login AT LEAST ONCE before using
2. Configure Plex Webhooks to point to `http://my-ip-or-hostname:3000/api/plex`
3. Set up and configure a Discord bot and server. Instructions are listed in the below sections
4. Clone this repo, cd to the repo directory
5. Run `npm install`
6. Copy `config.example.js` or create `config.js` and edit. Instructions in the below sections

Once the configuration is set up you can run the server (using `pm2`):

- `npm run prod:start` - Start the server
- `npm run prod:stop`  - Stop the server
- `npm run prod:restart`    - Restart the server
- `npm run prod:resurrect`  - Resurrect the server. Use after reboots
- `npm run prod:logs`   - View running logs
- `npm run prod:update` - Update the in-memory instance of pm2 if necessary

The entry point of the whole project is `./index.js`. You can create your own method of managing the server alternatvely.

## Config

This is the whole config with every option with comments. If using a code editor such as VSCode, there is JSDoc available for `createConfig()` for easier editing.

```javascript
// config.js

const createConfig = require("./util/config.jsdoc.js");

module.exports = createConfig({
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
    network_monitoring: { // For displaying upload/download rates from the network controller on the dashboard
        // Optional. Set to true to disable. Defaults to false.
        disabled: false,
        // Required if monitoring is enabled. The network interface to monitor (e.g., "eth0").
        interface: "enp0s4",
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
```

## Mega-CMD Setup

Instructions for your system [here](https://mega.io/cmd)

Once installed, you need to sign in at least once before used!

Run `mega-login [email] [password] --auth-code=XXXXXX (for 2FA)`

View `mega-login --help` for more details

## Discord bot Setup

To disable the bot entirely, set `config.discord_bot.disabled` to true and ignore the rest of the bot configuration.

To set up the bot, you will need to set up a Discord developer application and get its **TOKEN** and **OAuth Client ID**

Instructions can be found [here](https://discord.com/developers/docs/quick-start/getting-started) or [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-bot-s-token). DiscordJS is the node library in use

*Once the bot is set up, you should also personalize it with an icon and banner in the Discord Developer bot settings page!*

### Discord server setup

The bot can lend specific rule/s when a chat message is reacted to and broadcast updates and content requests to specific channels. This is useful for servers where you want to force your users to subscribe to your chat rules and log requests so they don't spam you (ideally). More server management and commands may be added at a later date...

Discord server configuration:

- New users should only see your "rules" channel that contains a pre-written message
- Set up a rule (or multiple) your users need to access channels
- Set `config.discord_bot.config.guild_id` to your server Guild ID
- Set `config.discord_bot.config.rules.rules_message_id` to the rule's message ID
- Set `config.discord_bot.config.rules.rules_reaction_emoji_name` to the emoji you want your users to react with
- Set `config.discord_bot.config.rules.roles_id.name` and `.roles_id.id` to the name and ID of the rule you want to give your user
    - There can be multiple rules configured here in the `.roles_id[]` array!
- Create an 'updates' channel. Create a webhook URL for this channel.
    - Set  `config.webhooks.discord_webhook_url` to the webhook url
- Create a seperate text channel only for you and the bot. Create a webhook for this channel (optional)
    - (optional) Set `config.webhooks.test_discord_webhook_url` to the webhook url

## Usage

### Mega-CMD Dashboard

Site is accessed at `http://localhost-or-ip:3000` by default

You can input a mega url to download. Transfers (downloads/uploads) will be polled every 2 seconds.

You can adjust and filter the Transfers table with the Filter text input and column view check boxes

You can view logs and requests at `http://localhost:3000/logs`. Logs are stored in `./logs`

### Discord Bot & Plexpass Webhooks

*`library.new` is the only Plex event supported right now...*

Allows you to configure your server to force users to react to a "rules" message to gain access to the rest of the server

When new content is added to your Plex server, a notificaton will be pushed to your configured Plex webhook.

You can disable webhooks entirely by setting `config.webhooks.disabled` to true

Your users can use the following chat commands:

- `/request [string[]]` - Sends a message to a seperate channel for you and logs the request viewable at `http://my-ip-or-hostname:3000/requests`

## Test environment

### Webhooks

You may want to fire Plex events for testing Discord messaging when changing the styling or adding new events (TBD)

`config.webhooks.test_discord_webhook_url` needs to be set!

Refer to [Plex documentation](https://support.plex.tv/articles/115002267687-webhooks/) and `./logs/*.json` for more information on Plex payload events

`npm run test:plex [plex_event_name]`

```
$ npm run test:plex help
> node ./test/test_plex.js

Usage:     npm run test:plex [plex_event_name]

Other options:
           help    Displays this message
           list-events     Lists available plex payload files
```

## TODO

There is a lot that can be done lol

- Fix/update frontend stylings for mobile

- Streamline the configuration process, flesh out ideas

- Run the bot seperately or provide controls/status to the frontend

- Add page for configuration (maybe)
    - Mega-cmd login, speedlimit, bot options

- Dockerize project

- More bot usage
    - Add more chat commands

- Add more plex event messages
    - Admin commands, health checks/status, ratings would be fun