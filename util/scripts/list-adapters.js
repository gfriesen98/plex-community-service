import { listAdapters } from "../sysinfo.js";

(async () => {
    try {
        const adapters = (await listAdapters()).map(n => {
            if (n === 'lo') return `name: ${n}\ttype: Loopback`;
            if (n.startsWith('enp') || n.startsWith('eth')) return `name: ${n}\ttype: Ethernet`;
            if (n.startsWith("wlan")) return `name: ${n}\ttype: Wifi`;
            return `name: ${n}`;
        });
        console.log(`Available nework adapters:\n${adapters.join("\n")}`);
    } catch (error) {
        console.error(error);
    }
})();