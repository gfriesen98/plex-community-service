// src/pages/transfers-page.jsx
import { useState, useEffect } from 'react';
import { DownloadForm } from '../components/download-form';
import { TransferTable } from '../components/transfer-table';
import { ActionButtons } from '../components/action-buttons';
import { FilterControls } from '../components/filter-controls';
import { SpeedMonitor } from '../components/speed-monitor';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function TransfersPage() {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allDownloadsPaused, setAllDownloadsPaused] = useState(false);
    const [outputPaths, setOutputPaths] = useState([]);
    const [lineLimit, setLineLimit] = useState('0');
    const [filter, setFilter] = useState('');
    const [visibleColumns, setVisibleColumns] = useState({
        id: true,
        tag: true,
        type: true,
        filename: true,
        progress: true,
        size: true,
        status: true,
        path: true,
        actions: true,
    });

    // ... (move all the existing transfer logic from App.jsx here)

    const fetchTransfers = async () => {
        try {
            const limitParam = lineLimit.trim();
            const res = await fetch(`/api/transfers?limit=${limitParam}`);
            const data = await res.json();

            setTransfers(data.json || []);
            setAllDownloadsPaused(data.all_downloads_paused || false);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching transfers:', error);
            setLoading(false);
        }
    };

    const fetchOutputPaths = async () => {
        try {
            const response = await fetch('/api/options');
            const data = await response.json();
            setOutputPaths(data.options.outputPathLabels || []);
        } catch (error) {
            console.error('Error fetching output paths:', error);
        }
    };

    const sendAction = async (endpoint) => {
        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) throw new Error('Action failed');
            await fetchTransfers();
        } catch (err) {
            alert('Failed to perform action: ' + endpoint);
        }
    };

    useEffect(() => {
        fetchTransfers();
        fetchOutputPaths();

        const savedLimit = localStorage.getItem('limit');
        if (savedLimit) setLineLimit(savedLimit);

        const savedColumns = localStorage.getItem('mega-cmd-column-visibility');
        if (savedColumns) {
            setVisibleColumns(JSON.parse(savedColumns));
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchTransfers, 2000);
        return () => clearInterval(interval);
    }, [lineLimit]);

    useEffect(() => {
        localStorage.setItem('limit', lineLimit);
    }, [lineLimit]);

    useEffect(() => {
        localStorage.setItem('mega-cmd-column-visibility', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    return (
        <div className="space-y-6">
            {/* Mobile-friendly tabs for smaller screens */}
            <div className="md:hidden">
                <Tabs defaultValue="transfers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transfers">Transfers</TabsTrigger>
                        <TabsTrigger value="download">Download</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transfers" className="space-y-4">
                        <FilterControls
                            filter={filter}
                            setFilter={setFilter}
                            visibleColumns={visibleColumns}
                            setVisibleColumns={setVisibleColumns}
                            lineLimit={lineLimit}
                            setLineLimit={setLineLimit}
                        />

                        {allDownloadsPaused && (
                            <Alert>
                                <AlertDescription>
                                    All downloads and uploads are paused. Transfers may show as ACTIVE still.
                                </AlertDescription>
                            </Alert>
                        )}

                        <ActionButtons sendAction={sendAction} />
                        <SpeedMonitor allDownloadsPaused={allDownloadsPaused} />

                        <TransferTable
                            transfers={transfers}
                            loading={loading}
                            filter={filter}
                            visibleColumns={visibleColumns}
                            sendAction={sendAction}
                        />
                    </TabsContent>

                    <TabsContent value="download">
                        <DownloadForm outputPaths={outputPaths} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:block space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <DownloadForm outputPaths={outputPaths} />
                    </CardContent>
                </Card>

                <FilterControls
                    filter={filter}
                    setFilter={setFilter}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                    lineLimit={lineLimit}
                    setLineLimit={setLineLimit}
                />

                {allDownloadsPaused && (
                    <Alert>
                        <AlertDescription>
                            All downloads and uploads are paused. Transfers may show as ACTIVE still.
                        </AlertDescription>
                    </Alert>
                )}

                <ActionButtons sendAction={sendAction} />
                <SpeedMonitor allDownloadsPaused={allDownloadsPaused} />

                <TransferTable
                    transfers={transfers}
                    loading={loading}
                    filter={filter}
                    visibleColumns={visibleColumns}
                    sendAction={sendAction}
                />
            </div>
        </div>
    );
}