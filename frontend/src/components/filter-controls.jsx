// src/components/filter-controls.jsx
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function FilterControls({ filter, setFilter, visibleColumns, setVisibleColumns, lineLimit, setLineLimit }) {
    const handleColumnToggle = (column, checked) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: checked
        }));
    };

    const columnOptions = [
        { key: 'id', label: 'ID' },
        { key: 'tag', label: 'Tag' },
        { key: 'type', label: 'Type' },
        { key: 'filename', label: 'File Name' },
        { key: 'progress', label: 'Progress' },
        { key: 'size', label: 'Size' },
        { key: 'status', label: 'Status' },
        { key: 'path', label: 'Path' },
        { key: 'actions', label: 'Actions' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filter & Display Options</CardTitle>
                <CardDescription>
                    Customize what you see in the transfers table
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filter">Filter Transfers</Label>
                        <Input
                            id="filter"
                            placeholder="Search transfers..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lineLimit">Output Limit</Label>
                        <Select value={lineLimit} onValueChange={setLineLimit}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Unlimited</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="40">40</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-medium">Visible Columns</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                        {columnOptions.map((column) => (
                            <div key={column.key} className="flex items-center space-x-2">
                                <Checkbox
                                    id={column.key}
                                    checked={visibleColumns[column.key]}
                                    onCheckedChange={(checked) => handleColumnToggle(column.key, checked)}
                                />
                                <Label htmlFor={column.key} className="text-sm">
                                    {column.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}