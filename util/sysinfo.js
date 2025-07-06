import * as si from 'systeminformation';
import { bytesH } from './common.js';

export async function listAdapters() {
    try {
        const n_interface = await si.networkInterfaces();
        const adapters = [];
        for (const iface of n_interface) {
            adapters.push(iface.iface);
        }

        return adapters;
    } catch (error) {
        console.error('Error listing adapters: ', error);
        return [];
    }
}

function adapterExists(interfaceName, adapters) {
    try {
        for (const a of adapters) {
            if (interfaceName === a) return true;
        }
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function networkMonitor(adapter, intervalMs = 1000) {
    let pollingIntervalId = null;
    let prevStats = null;
    let lastMeasurementTime = Date.now();
    let latestSpeed = null;

    async function pollNetworkStats() {
        const currentStats = await si.networkStats(adapter);
        const now = Date.now();

        if (currentStats && currentStats.length > 0) {
            const adapterStat = currentStats.find(s => s.iface === adapter);
            if (adapterStat && prevStats) {
                const timeDiff = (now - lastMeasurementTime) / 1000;

                if (timeDiff > 0) {
                    const downloadBps = (adapterStat.rx_bytes - prevStats.rx_bytes) / timeDiff;
                    const uploadBps = (adapterStat.tx_bytes - prevStats.tx_bytes) / timeDiff;

                    latestSpeed = {
                        download: bytesH(downloadBps),
                        upload: bytesH(uploadBps)
                    };
                }
            }
            prevStats = adapterStat;
        }
        lastMeasurementTime = now;
    }

    return {
        start: async () => {
            const adapters = await listAdapters();
            if (adapters <= 0) throw new Error(`Error starting network monitoring. Could not get any interfaces.`);
            if (!adapterExists(adapter, adapters)) throw new Error(`Error starting network monitoring. Adapter ${adapter} does not exist.`);

            if (!pollingIntervalId) {
                console.log(`Starting network speed monitoring for adapter: ${adapter}`);
                pollNetworkStats();
                pollingIntervalId = setInterval(pollNetworkStats, intervalMs);
            }
        },

        stop: () => {
            if (pollingIntervalId) {
                // console.log(`Stopping network speed monitoring for adapter: ${adapter}`);
                clearInterval(pollingIntervalId);
                pollingIntervalId = null;
                prevStats = null;
                latestSpeed = null;
                console.log('Stopped network monitor');
            }
        },

        get latestSpeed() {
            return latestSpeed;
        },
    };
}

// module.exports = {
//     listAdapters,
//     networkMonitor,
// };