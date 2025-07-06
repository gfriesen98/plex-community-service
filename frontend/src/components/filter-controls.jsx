import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

export function FilterControls({ visibleColumns, setVisibleColumns }) {
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
        <div>
            {/* <Label className="text-sm font-medium">Visible Columns</Label> */}
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
    );
}