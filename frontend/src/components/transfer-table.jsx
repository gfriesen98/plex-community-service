// src/components/transfer-table.jsx
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertTitle } from './ui/alert';
import { AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SpeedMonitor } from './speed-monitor';
import { FilterControls } from './filter-controls';
import { Pause, Play, X, BadgeAlert } from 'lucide-react';

export function TransferTable({ transfers, loading, filter, visibleColumns, setVisibleColumns, sendAction, allDownloadsPaused }) {
    const filteredTransfers = transfers.filter(transfer => {
        if (!filter) return true;

        const searchText = filter.toLowerCase();
        const searchableFields = [
            transfer.id,
            transfer.tag?.number,
            transfer.type?.text,
            transfer.destinyPath?.filename,
            transfer.state?.text,
            transfer.destinyPath?.text,
        ];

        return searchableFields.some(field =>
            field?.toString().toLowerCase().includes(searchText)
        );
    });

    const renderProgressBar = (percent, isPaused) => {
        if (typeof percent !== 'number' || isNaN(percent)) {
            return <div className="text-sm text-muted-foreground">Processing...</div>;
        }

        const safePercent = Math.max(0, Math.min(100, percent));

        return (
            <div className="space-y-1">
                <Progress
                    value={safePercent}
                    className={`h-2 ${isPaused ? 'opacity-50' : ''}`}
                />
                <div className="text-xs text-muted-foreground">
                    {safePercent.toFixed(1)}%
                </div>
            </div>
        );
    };

    const getStatusBadge = (status) => {
        const variant = {
            'ACTIVE': 'default',
            'PAUSED': 'secondary',
            'QUEUED': 'outline',
            'COMPLETED': 'success',
            'FAILED': 'destructive'
        }[status] || 'outline';

        return <Badge variant={variant}>{status}</Badge>;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Current Transfers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading transfers...</div>
                </CardContent>
            </Card>
        );
    }

    if (filteredTransfers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Current Transfers</CardTitle>
                    <FilterControls
                        visibleColumns={visibleColumns}
                        setVisibleColumns={setVisibleColumns}
                    />
                </CardHeader>
                <CardContent>
                    {transfers.length > 0 ? <SpeedMonitor allDownloadsPaused={allDownloadsPaused} /> : <></>}
                    <div className="text-center py-8 text-muted-foreground">
                        {transfers.length === 0 ? 'No active transfers' : 'No transfers match your filter'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Transfers ({filteredTransfers.length})</CardTitle>
                <FilterControls
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                />
            </CardHeader>
            {allDownloadsPaused ? (
                <CardContent>
                    <Alert className="bg-warning text-warning-foreground">
                        <BadgeAlert />
                        <AlertTitle>
                            All downloads are paused.
                        </AlertTitle>
                        <AlertDescription>
                            Transfers may show as ACTIVE still.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            ) : (
                <CardContent>
                    {transfers.length > 0 ? 
                        <SpeedMonitor allDownloadsPaused={allDownloadsPaused} /> : 
                        <></>
                    }
                </CardContent>
            )}
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleColumns.id && <TableHead>ID</TableHead>}
                                {visibleColumns.tag && <TableHead>Tag</TableHead>}
                                {visibleColumns.type && <TableHead className="hidden md:table-cell">Type</TableHead>}
                                {visibleColumns.filename && <TableHead>File</TableHead>}
                                {visibleColumns.progress && <TableHead>Progress</TableHead>}
                                {visibleColumns.size && <TableHead className="hidden lg:table-cell">Size</TableHead>}
                                {visibleColumns.status && <TableHead>Status</TableHead>}
                                {visibleColumns.path && <TableHead className="hidden xl:table-cell">Path</TableHead>}
                                {visibleColumns.actions && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransfers.map((transfer) => {
                                const tag = transfer.tag?.number;
                                const isPaused = transfer.state?.text === 'PAUSED';
                                const isActive = transfer.state?.text === 'ACTIVE';
                                const isQueued = transfer.state?.text === 'QUEUED';

                                return (
                                    <TableRow key={transfer.id}>
                                        {visibleColumns.id && (
                                            <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                                        )}
                                        {visibleColumns.tag && (
                                            <TableCell className="font-mono text-sm">{tag}</TableCell>
                                        )}
                                        {visibleColumns.type && (
                                            <TableCell className="hidden md:table-cell">{transfer.type?.text}</TableCell>
                                        )}
                                        {visibleColumns.filename && (
                                            <TableCell className="max-w-[200px] truncate" title={transfer.destinyPath?.filename}>
                                                {transfer.destinyPath?.filename}
                                            </TableCell>
                                        )}
                                        {visibleColumns.progress && (
                                            <TableCell className="min-w-[120px]">
                                                {renderProgressBar(transfer.progress?.percent, isPaused)}
                                            </TableCell>
                                        )}
                                        {visibleColumns.size && (
                                            <TableCell className="hidden lg:table-cell">{transfer.progress?.size}</TableCell>
                                        )}
                                        {visibleColumns.status && (
                                            <TableCell>{getStatusBadge(transfer.state?.text)}</TableCell>
                                        )}
                                        {visibleColumns.path && (
                                            <TableCell className="hidden xl:table-cell max-w-[200px] truncate" title={transfer.destinyPath?.text}>
                                                {transfer.destinyPath?.text?.split('/').slice(0, -1).join('/')}
                                            </TableCell>
                                        )}
                                        {visibleColumns.actions && (
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => sendAction(`/api/pause/${tag}`)}
                                                        disabled={isPaused}
                                                    >
                                                        <Pause className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => sendAction(`/api/resume/${tag}`)}
                                                        disabled={isActive || isQueued}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Cancel this transfer?')) {
                                                                sendAction(`/api/cancel/${tag}`);
                                                            }
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}