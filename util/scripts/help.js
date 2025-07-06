const h = `
plex-community-service management

Most everything can be managed through these npm commands.

# Server Management
PM2 is included in the project by default after 'npm install' has been run.
You can install PM2 globally with 'npm install -g pm2' if you prefer to have it seperately.
You may also use anything else to manage how the server is run. (Systemd, etc...)

npm run prod:init\tRun this after installing. Builds the frontend and initializes pm2 for hosting and starts the server
npm run prod:resurrect\tIf the system crashes, use this upon restart to resume pm2
npm run prod:stop\tStop the production server
npm run prod:restart\tRestart the production server
npm run prod:logs\tView production logs

# Development
These commands are used when developing on the frontend. Vite is the build tool used for React

npm run ui:dev\tRun a development server for the frontend. 
npm run ui:build\tBuild the frontend.
npm run ui:preview\tPreview the frontend.
npm run shad:add\tShortcut for "npx shadcn@latest add, for frontend development"

# Misc. Util
npm run help\tShows this message
npm run adapters\tGet a list of available network adapters for config.js.

# Testing
npm run test:plex [help|event]\tTest discord webhook messaging with predefined Plex json payloads.

# Discord bot
npm run bot:deploy\tDeploy slash commands. Use if updating or creating new commands.
`

console.log(h);