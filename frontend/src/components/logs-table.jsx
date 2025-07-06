// src/components/logs-table.jsx
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

export function LogsTable({ logs, loading }) {
    const getSubtypeBadge = (subtype) => {
        const variant = {
            'success': 'default',
            'error': 'destructive',
        }[subtype] || 'secondary';

        return <Badge variant={variant}>{subtype}</Badge>;
    };

    const formatInfo = (info) => {
        if (typeof info === 'object') {
            return (
                <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-x-auto">
                    {JSON.stringify(info, null, 2)}
                </pre>
            );
        }
        return info;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Log Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading logs...</div>
                </CardContent>
            </Card>
        );
    }

    if (logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Log Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No logs found for the selected criteria.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Log Entries ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Subtype</TableHead>
                                <TableHead>Information</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono text-sm">
                                        {log.time || ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.type || ''}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.subtype && getSubtypeBadge(log.subtype)}
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        {formatInfo(log.info)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}