import { CheckCircle2, MessageCircle, Zap, CoffeeIcon, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsivenessOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const responsivenessOptions: ResponsivenessOption[] = [
  {
    id: "instant",
    label: "Instant",
    description: "Responds within 1-5 minutes",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "active",
    label: "Active",
    description: "Responds within 5-30 minutes",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    id: "casual",
    label: "Casual",
    description: "Responds within 30-120 minutes",
    icon: <CoffeeIcon className="h-5 w-5" />,
  },
  {
    id: "zen",
    label: "Zen",
    description: "Responds within 2-24 hours",
    icon: <Brain className="h-5 w-5" />,
  },
];

interface ResponsivenessCardSelectorProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function ResponsivenessCardSelector({ values, onChange }: ResponsivenessCardSelectorProps) {
  const toggleValue = (id: string) => {
    if (values.includes(id)) {
      // Only allow removing if there will still be at least one option selected
      if (values.length > 1) {
        onChange(values.filter((value) => value !== id));
      }
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {responsivenessOptions.map((option) => {
        const isSelected = values.includes(option.id);
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer relative",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
            onClick={() => toggleValue(option.id)}
          >
            {isSelected && (
              <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
            )}
            <div className="mr-4 mt-1 text-primary">{option.icon}</div>
            <div>
              <h4 className="font-medium mb-1">{option.label}</h4>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}