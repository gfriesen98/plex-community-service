// src/components/action-buttons.jsx
import { Button } from './ui/button';
import { Pause, Play, X } from 'lucide-react';

export function ActionButtons({ sendAction }) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                onClick={() => sendAction('/api/pauseAll')}
                className="flex items-center gap-2"
            >
                <Pause className="h-4 w-4" />
                Pause All
            </Button>
            <Button
                variant="outline"
                onClick={() => sendAction('/api/resumeAll')}
                className="flex items-center gap-2"
            >
                <Play className="h-4 w-4" />
                Resume All
            </Button>
            <Button
                variant="destructive"
                onClick={() => {
                    if (confirm('Cancel ALL transfers?')) {
                        sendAction('/api/cancelAll');
                    }
                }}
                className="flex items-center gap-2"
            >
                <X className="h-4 w-4" />
                Cancel All
            </Button>
        </div>
    );
}