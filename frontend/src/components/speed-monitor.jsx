// src/components/speed-monitor.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Download, Upload } from 'lucide-react';

export function SpeedMonitor({ allDownloadsPaused }) {
    const [speeds, setSpeeds] = useState({ download: '', upload: '' });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (allDownloadsPaused) {
            setVisible(false);
            return;
        }

        const fetchSpeeds = async () => {
            try {
                const res = await fetch('/api/network/speed');
                if (res.status === 403) {
                    setVisible(false);
                    return;
                }
                const data = await res.json();
                setSpeeds(data);
                setVisible(true);
            } catch (error) {
                console.error('Error fetching speeds:', error);
            }
        };

        const interval = setInterval(fetchSpeeds, 2000);
        return () => clearInterval(interval);
    }, [allDownloadsPaused]);

    if (!visible) return null;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Download:</span>
                        <span className="text-sm">{speeds.download}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Upload:</span>
                        <span className="text-sm">{speeds.upload}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}