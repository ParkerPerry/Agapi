import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorIcon, WrenchIcon } from "lucide-react";

// Map tool IDs to icons
const TOOL_ICONS: Record<string, React.ReactNode> = {
  calculator: <CalculatorIcon className="h-3 w-3" />,
  // Add more tool icons here as they're implemented
};

interface ToolsUsedIndicatorProps {
  toolsUsed?: {
    used: boolean;
    tools: Array<{
      id: string;
      name: string;
      usageCount: number;
      examples: string[];
    }>;
  };
}

export function ToolsUsedIndicator({ toolsUsed }: ToolsUsedIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  // If no tools were used or tools data is missing, don't render anything
  if (!toolsUsed || !toolsUsed.used || toolsUsed.tools.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center mt-2">
      <Badge variant="outline" className="text-xs py-0 px-2 gap-1 border-blue-300 text-blue-600 flex items-center">
        <WrenchIcon className="h-3 w-3" />
        <span>Tools used</span>
      </Badge>
      
      {/* Show small badges for each tool used */}
      <div className="flex gap-1 ml-2">
        {toolsUsed.tools.map((tool) => (
          <TooltipProvider key={tool.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs py-0 px-1 border-blue-300 bg-blue-50 flex items-center">
                  {TOOL_ICONS[tool.id] || <WrenchIcon className="h-3 w-3" />}
                  <span className="ml-1">{tool.name}</span>
                  {tool.usageCount > 1 && <span className="ml-1 text-xs text-blue-500">x{tool.usageCount}</span>}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-semibold text-xs">{tool.name} tool used {tool.usageCount} times</p>
                {tool.examples.length > 0 && (
                  <div className="mt-1 text-xs">
                    <p className="font-medium">Examples:</p>
                    <ul className="list-disc pl-3 text-xs">
                      {tool.examples.map((example, index) => (
                        <li key={index} className="text-xs">{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}