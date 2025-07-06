// src/pages/logs-page.jsx
import { useState, useEffect } from 'react';
import { LogsFilter } from '../components/logs-filter';
import { LogsTable } from '../components/logs-table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

export function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        dateTag: 'today',
        type: 'all',
        subtype: 'all',
        sortBy: 'time',
        sortOrder: 'desc'
    });

    const fetchLogs = async () => {
        if (!filters.dateTag.trim()) {
            setError('Please enter a date or tag.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const apiUrl = `/api/log/${filters.dateTag}?filterByType=${filters.type}&filterBySubtype=${filters.subtype}&sortBy=${filters.sortBy}&sortOrder=${filters.sortOrder}`;
            const res = await fetch(apiUrl);

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || 'Error fetching logs');
                setLogs([]);
                return;
            }

            const logsData = await res.json();
            setLogs(logsData);
            setError('');

        } catch (error) {
            console.error('Error fetching logs:', error);
            setError('An error occurred while fetching logs.');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Check URL params on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const date = urlParams.get('date');

        if (type) {
            setFilters(prev => ({ ...prev, type }));
        }
        if (date) {
            setFilters(prev => ({ ...prev, dateTag: date }));
        }
    }, []);

    // Fetch logs when filters change
    useEffect(() => {
        fetchLogs();
    }, [filters]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Log Entries</CardTitle>
                        <Badge variant="outline">
                            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <LogsFilter
                        filters={filters}
                        setFilters={setFilters}
                        onFetchLogs={fetchLogs}
                    />
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <LogsTable
                logs={logs}
                loading={loading}
            />
        </div>
    );
}