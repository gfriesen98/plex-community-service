// src/components/download-form.jsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function DownloadForm({ outputPaths }) {
    const [url, setUrl] = useState('');
    const [outputPath, setOutputPath] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        if (!url || !outputPath) {
            setMessage('Please enter both URL and output path.');
            setMessageType('error');
            return;
        }

        try {
            const url_arr = url.split(/\s+/ig);
            const res = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url_arr, outputPathLabel: outputPath }),
            });

            const data = await res.json();

            if (res.ok) {
                const successful = data.successful_queues?.length || 0;
                const unsuccessful = data.unsuccessful_queues?.length || 0;

                let message = '';
                if (successful > 0) {
                    message += `${successful} Download${successful > 1 ? 's' : ''} started! `;
                }
                if (unsuccessful > 0) {
                    message += `${unsuccessful} Downloads failed to queue.`;
                }

                setMessage(message || 'Downloads queued successfully!');
                setMessageType('success');
                setUrl('');
            } else {
                setMessage(data.error || 'Failed to start download');
                setMessageType('error');
            }
        } catch (err) {
            setMessage('Network error.');
            setMessageType('error');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Download</CardTitle>
                <CardDescription>
                    Enter MEGA URL(s) and select output path
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">MEGA URL(s)</Label>
                        <Input
                            id="url"
                            type="text"
                            placeholder="https://mega.nz/... (multiple URLs supported)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="outputPath">Output Path</Label>
                        <Select value={outputPath} onValueChange={setOutputPath} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select output path" />
                            </SelectTrigger>
                            <SelectContent>
                                {outputPaths.map((path) => (
                                    <SelectItem key={path} value={path}>
                                        {path}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full">
                        Add Download
                    </Button>

                    {message && (
                        <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}