import React from 'react';
import { Button } from "@/components/ui/button";

interface ActionProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ActionProps;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      {action && (
        <Button 
          onClick={action.onClick}
          variant={action.variant || "default"}
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}