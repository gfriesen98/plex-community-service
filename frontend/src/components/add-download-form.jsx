import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function AddDownloadForm({ outputPaths, onSubmit }) {
  const [url, setUrl] = useState("");
  const [outputPath, setOutputPath] = useState("");

  // Set default path when paths load
  useState(() => {
    if (outputPaths.length > 0 && !outputPath) {
      setOutputPath(outputPaths[0]);
    }
  }, [outputPaths]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || !outputPath) {
      alert("Please provide a URL and select a path.");
      return;
    }
    const url_arr = url.split(/\s+/gi).filter(Boolean);
    onSubmit({ url_arr, outputPathLabel: outputPath });
    setUrl(""); // Clear input after submission
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Download</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">MEGA URL(s)</Label>
            <Input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mega.nz/... (can paste multiple, space-separated)"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputPath">Output Path</Label>
            <Select
              id="outputPath"
              value={outputPath}
              onValueChange={setOutputPath}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a destination..." />
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
          <Button type="submit" className="w-full sm:w-auto">
            Add Download
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}