import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, Check, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useImportFollower } from "@/lib/mutations/follower-mutations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIFollowerProfile } from "@shared/follower-profile-schema";

// Extended type to include the metadata field from the JSON examples
interface ExtendedAIFollowerProfile extends AIFollowerProfile {
  metadata?: {
    exportedAt?: string;
    exportedBy?: string;
    model?: string;
    originalName?: string;
    originalUrl?: string;
    source?: string;
  };
  schemaVersion?: string;
}

export function FollowerImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [previewData, setPreviewData] = useState<ExtendedAIFollowerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const importMutation = useImportFollower();

  // Read file as JSON
  const readFileAsJson = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setIsValidJson(null);
    setPreviewData(null);

    if (!selectedFile) return;

    try {
      // Validate file type
      if (!selectedFile.name.endsWith('.json')) {
        setError("File must be a JSON file");
        return;
      }

      // Read and parse the JSON file
      const jsonData = await readFileAsJson(selectedFile);
      
      // Basic validation - check for required fields
      if (!jsonData.name || !jsonData.personality || !jsonData.avatarUrl || !jsonData.responsiveness) {
        setError("JSON file is missing required fields");
        setIsValidJson(false);
        return;
      }

      // Set preview data
      setPreviewData(jsonData);
      setIsValidJson(true);
    } catch (err) {
      setError((err as Error).message);
      setIsValidJson(false);
    }
  };

  // Handle import submission
  const handleImport = async () => {
    if (!previewData) return;

    try {
      await importMutation.mutateAsync(previewData);
      setFile(null);
      setPreviewData(null);
      setIsValidJson(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import AI Follower</CardTitle>
        <CardDescription>
          Import an AI follower from a JSON file. The file should contain the follower's profile data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="json-file">Upload JSON file</Label>
          <div className="flex items-center gap-2">
            <Input
              id="json-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="flex-1"
            />
            {isValidJson === true && <Check className="h-5 w-5 text-green-500" />}
            {isValidJson === false && <AlertCircle className="h-5 w-5 text-red-500" />}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview Follower Data</h3>
            <div className="rounded-md border p-4 bg-muted/40">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{previewData.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Responsiveness</Label>
                  <p className="font-medium capitalize">{previewData.responsiveness}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Personality</Label>
                  <p className="text-sm">{previewData.personality}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Avatar URL</Label>
                  <p className="text-xs text-muted-foreground truncate">{previewData.avatarUrl}</p>
                </div>
                {previewData.background && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Background</Label>
                    <p className="text-sm">{previewData.background.substring(0, 100)}...</p>
                  </div>
                )}
                {previewData.interests && previewData.interests.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Interests</Label>
                    <p className="text-sm">{previewData.interests.join(", ")}</p>
                  </div>
                )}
                
                {/* Metadata section */}
                {previewData.metadata && (
                  <div className="col-span-2 mt-4 border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Metadata</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {previewData.metadata.source && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Source</Label>
                          <p>{previewData.metadata.source}</p>
                        </div>
                      )}
                      {previewData.metadata.model && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Model</Label>
                          <p>{previewData.metadata.model}</p>
                        </div>
                      )}
                      {previewData.metadata.originalName && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Original Name</Label>
                          <p>{previewData.metadata.originalName}</p>
                        </div>
                      )}
                      {previewData.metadata.exportedAt && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Exported At</Label>
                          <p>{new Date(previewData.metadata.exportedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {previewData.metadata.exportedBy && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Exported By</Label>
                          <p>{previewData.metadata.exportedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setFile(null);
            setPreviewData(null);
            setIsValidJson(null);
            setError(null);
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!isValidJson || importMutation.isPending}
        >
          {importMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Follower
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}