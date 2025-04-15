import React, { useState } from "react";
import { InsertLabTemplate } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beaker, BookOpen, BarChart4, Users } from "lucide-react";
import predefinedLabTemplates, { getTemplatesByCategory } from "@/data/lab-templates";

// Define type for our simplified template data structure
export type LabTemplateData = Omit<InsertLabTemplate, "isDefault">;

interface LabTemplateCardProps {
  template: Omit<InsertLabTemplate, "isDefault">;
  onSelect: (template: Omit<InsertLabTemplate, "isDefault">) => void;
}

/**
 * Card display for an individual lab template
 */
const LabTemplateCard: React.FC<LabTemplateCardProps> = ({ template, onSelect }) => {
  const getCategoryIcon = (category: InsertLabTemplate["category"]) => {
    switch(category) {
      case "product":
        return <Beaker className="h-4 w-4" />;
      case "marketing":
        return <BarChart4 className="h-4 w-4" />;
      case "content":
        return <BookOpen className="h-4 w-4" />;
      case "engagement":
        return <Users className="h-4 w-4" />;
      default:
        return <Beaker className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="h-full hover:border-primary/50 cursor-pointer transition-all" onClick={() => onSelect(template)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            {getCategoryIcon(template.category)}
            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-xs text-muted-foreground mb-2">Key metrics:</p>
        <div className="flex flex-wrap gap-1">
          {template.successMetrics.metrics.slice(0, 2).map((metric, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {metric.name}
            </Badge>
          ))}
          {template.successMetrics.metrics.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{template.successMetrics.metrics.length - 2} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
          e.stopPropagation();
          onSelect(template);
        }}>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

interface LabTemplateSelectorProps {
  onSelectTemplate: (template: Omit<InsertLabTemplate, "isDefault">) => void;
}

/**
 * Component for selecting a lab template from predefined options
 * or using a custom template
 */
const LabTemplateSelector: React.FC<LabTemplateSelectorProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<InsertLabTemplate["category"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTemplates = selectedCategory === "all" 
    ? predefinedLabTemplates 
    : getTemplatesByCategory(selectedCategory);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-base font-medium">Choose a Template (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Select a template to quickly set up your experiment with predefined goals and metrics
        </p>
      </div>
      
      <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value as any)}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-1">
            <Beaker className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Product</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-1">
            <BarChart4 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Engagement</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {filteredTemplates.map((template, idx) => (
          <LabTemplateCard 
            key={idx} 
            template={template} 
            onSelect={onSelectTemplate} 
          />
        ))}
      </div>
    </div>
  );
};

export default LabTemplateSelector;