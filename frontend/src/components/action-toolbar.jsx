import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pause,
  Play,
  XCircle,
  ChevronDown,
  Download,
  Upload,
} from "lucide-react";

// Default visibility state
const defaultColumnVisibility = {
  id: true,
  tag: true,
  type: false,
  filename: true,
  progress: true,
  size: true,
  status: true,
  path: false,
  actions: true,
};

export function ActionToolbar({
  onFilterChange,
  onLineLimitChange,
  lineLimit,
  onPauseAll,
  onResumeAll,
  onCancelAll,
  speed,
  isSpeedMonitorActive,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Input
        placeholder="Filter transfers..."
        onChange={(e) => onFilterChange(e.target.value)}
        className="flex-grow"
      />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" onClick={onPauseAll} className="w-full">
          <Pause className="mr-2 h-4 w-4" /> Pause All
        </Button>
        <Button variant="outline" onClick={onResumeAll} className="w-full">
          <Play className="mr-2 h-4 w-4" /> Resume All
        </Button>
        <Button
          variant="destructive"
          onClick={onCancelAll}
          className="w-full"
        >
          <XCircle className="mr-2 h-4 w-4" /> Cancel All
        </Button>
      </div>
      {isSpeedMonitorActive && (
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" /> {speed.download}
          </span>
          <span className="flex items-center gap-1">
            <Upload className="h-4 w-4" /> {speed.upload}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={lineLimit} onValueChange={onLineLimitChange}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Unlimited</SelectItem>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="20">20 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}