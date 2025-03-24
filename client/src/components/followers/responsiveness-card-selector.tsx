import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Clock, HourglassIcon, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsivenessOptions {
  value: "instant" | "active" | "casual" | "zen";
  onChange: (value: "instant" | "active" | "casual" | "zen") => void;
}

interface ResponsivenessOption {
  id: "instant" | "active" | "casual" | "zen";
  label: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export function ResponsivenessCardSelector({ value, onChange }: ResponsivenessOptions) {
  const options: ResponsivenessOption[] = [
    {
      id: "instant",
      label: "Instant",
      description: "Responds immediately",
      time: "0-5 min",
      icon: <Zap className="h-8 w-8" />,
      color: "bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-700"
    },
    {
      id: "active",
      label: "Active",
      description: "Responds within minutes",
      time: "5-60 min",
      icon: <Clock className="h-8 w-8" />,
      color: "bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700"
    },
    {
      id: "casual",
      label: "Casual",
      description: "Responds within hours",
      time: "1-8 hrs",
      icon: <HourglassIcon className="h-8 w-8" />,
      color: "bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-700"
    },
    {
      id: "zen",
      label: "Zen",
      description: "Responds within a day",
      time: "8-24 hrs",
      icon: <Coffee className="h-8 w-8" />,
      color: "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {options.map((option) => (
        <Card 
          key={option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "cursor-pointer border-2 transition-all duration-200 hover:shadow-md",
            value === option.id 
              ? `${option.color} border-2 shadow-sm scale-[1.02]` 
              : "hover:border-gray-300 hover:dark:border-gray-600"
          )}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 text-center h-full">
            <div className={cn(
              "p-2 rounded-full mb-2",
              value === option.id ? "text-primary" : "text-muted-foreground"
            )}>
              {option.icon}
            </div>
            <h3 className="font-medium mb-1">{option.label}</h3>
            <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
            <span className="text-xs font-semibold">{option.time}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}