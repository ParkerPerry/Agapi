import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResponsivenessOption = "instant" | "active" | "casual" | "zen";

interface ResponsivenessCardSelectorProps {
  value: ResponsivenessOption;
  onChange: (value: ResponsivenessOption) => void;
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

export function ResponsivenessCardSelector({ value, onChange }: ResponsivenessCardSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {responsivenessCards.map((option) => (
        <Card 
          key={option.value}
          className={cn(
            "cursor-pointer transition-all hover:bg-muted/50",
            value === option.value ? "border-2 border-primary bg-muted/30" : "border-border"
          )}
          onClick={() => onChange(option.value)}
        >
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-lg">{option.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            <div className="mt-3 py-1 bg-muted rounded-full text-xs font-medium">
              {option.timeRange}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}