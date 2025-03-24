import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Watch, 
  Coffee, 
  Leaf,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ResponsivenessOption = "instant" | "active" | "casual" | "zen";

interface ResponsivenessIconSelectorProps {
  values: ResponsivenessOption[];
  onChange: (values: ResponsivenessOption[]) => void;
}

interface ResponsivenessButton {
  value: ResponsivenessOption;
  label: string;
  icon: React.ReactNode;
  timeRange: string;
}

const responsivenessButtons: ResponsivenessButton[] = [
  {
    value: "instant",
    label: "Instant",
    icon: <Zap className="h-8 w-8 mb-2" />,
    timeRange: "0-5 min"
  },
  {
    value: "active",
    label: "Active",
    icon: <Watch className="h-8 w-8 mb-2" />,
    timeRange: "5-60 min"
  },
  {
    value: "casual",
    label: "Casual",
    icon: <Coffee className="h-8 w-8 mb-2" />,
    timeRange: "1-8 hrs"
  },
  {
    value: "zen",
    label: "Zen",
    icon: <Leaf className="h-8 w-8 mb-2" />,
    timeRange: "8-24 hrs"
  }
];

export function ResponsivenessIconSelector({ values, onChange }: ResponsivenessIconSelectorProps) {
  const handleToggle = (value: ResponsivenessOption) => {
    if (values.includes(value)) {
      // If already selected, remove it
      onChange(values.filter(v => v !== value));
    } else {
      // Add to selection
      onChange([...values, value]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {responsivenessButtons.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "h-auto py-6 flex flex-col items-center justify-center relative",
              isSelected ? "border-2 border-primary" : ""
            )}
            onClick={() => handleToggle(option.value)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-white">
                  <Check className="h-3 w-3 text-primary" />
                </Badge>
              </div>
            )}
            {option.icon}
            <span className="font-medium">{option.label}</span>
            <span className="text-xs mt-1">{option.timeRange}</span>
          </Button>
        );
      })}
    </div>
  );
}