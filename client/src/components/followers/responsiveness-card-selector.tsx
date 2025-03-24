import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

type ResponsivenessOption = "instant" | "active" | "casual" | "zen";

interface ResponsivenessCardSelectorProps {
  values: ResponsivenessOption[];
  onChange: (values: ResponsivenessOption[]) => void;
}

interface ResponsivenessCard {
  value: ResponsivenessOption;
  label: string;
  description: string;
  timeRange: string;
}

const responsivenessCards: ResponsivenessCard[] = [
  {
    value: "instant",
    label: "Instant",
    description: "Responds immediately",
    timeRange: "0-5 min"
  },
  {
    value: "active",
    label: "Active",
    description: "Responds within minutes",
    timeRange: "5-60 min"
  },
  {
    value: "casual",
    label: "Casual",
    description: "Responds within hours",
    timeRange: "1-8 hrs"
  },
  {
    value: "zen",
    label: "Zen",
    description: "Responds within a day",
    timeRange: "8-24 hrs"
  }
];

export function ResponsivenessCardSelector({ values, onChange }: ResponsivenessCardSelectorProps) {
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
      {responsivenessCards.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <Card 
            key={option.value}
            className={cn(
              "cursor-pointer transition-all hover:bg-muted/50 relative",
              isSelected ? "border-2 border-primary bg-muted/30" : "border-border"
            )}
            onClick={() => handleToggle(option.value)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
                  <Check className="h-3 w-3" />
                </Badge>
              </div>
            )}
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-lg">{option.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              <div className="mt-3 py-1 bg-muted rounded-full text-xs font-medium">
                {option.timeRange}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}