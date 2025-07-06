// src/components/logs-filter.jsx
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Search } from 'lucide-react';

export function LogsFilter({ filters, setFilters, onFetchLogs }) {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onFetchLogs();
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dateTag">Date</Label>
                        <Input
                            id="dateTag"
                            placeholder="DD-MM-YYYY, today, yesterday, all"
                            value={filters.dateTag}
                            onChange={(e) => handleFilterChange('dateTag', e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={filters.type}
                            onValueChange={(value) => handleFilterChange('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="request">Request</SelectItem>
                                <SelectItem value="queue">Queue</SelectItem>
                                <SelectItem value="webhook">Webhook</SelectItem>
                                <SelectItem value="job">Job</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subtype">Subtype</Label>
                        <Select
                            value={filters.subtype}
                            onValueChange={(value) => handleFilterChange('subtype', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sortBy">Sort By</Label>
                        <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange('sortBy', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="time">Time</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                                <SelectItem value="subtype">Subtype</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Select
                            value={filters.sortOrder}
                            onValueChange={(value) => handleFilterChange('sortOrder', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={onFetchLogs}
                            className="w-full"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Fetch Logs
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}