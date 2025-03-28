import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: PageHeaderAction;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="flex-shrink-0"
        >
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}