import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Watch, 
  Coffee, 
  Leaf
} from "lucide-react";

type ResponsivenessOption = "instant" | "active" | "casual" | "zen";

interface ResponsivenessIconSelectorProps {
  value: ResponsivenessOption;
  onChange: (value: ResponsivenessOption) => void;
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

export function ResponsivenessIconSelector({ value, onChange }: ResponsivenessIconSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {responsivenessButtons.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          className="h-auto py-6 flex flex-col items-center justify-center"
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span className="font-medium">{option.label}</span>
          <span className="text-xs mt-1">{option.timeRange}</span>
        </Button>
      ))}
    </div>
  );
}