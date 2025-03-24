import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ResponsivenessCardSelector } from "../responsiveness-card-selector"; 
import { Control } from "react-hook-form";
import { CollectiveFormValues } from "../simplified-collective-form";
import { getDefaultDelay } from "../collective-create-form";

interface ResponsivenessSectionProps {
  control: Control<CollectiveFormValues>;
  form: any; // UseFormReturn but keeping it simple for now
}

export function ResponsivenessSection({ control, form }: ResponsivenessSectionProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="responsivenessMulti"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Response Time Options</FormLabel>
            <FormDescription>
              Select the response options for how quickly followers will respond to posts and comments
            </FormDescription>
            <FormControl>
              <ResponsivenessCardSelector 
                values={field.value} 
                onChange={(values) => {
                  field.onChange(values);
                  // If there's at least one value selected, use the first one to set primary responsiveness
                  if (values.length > 0) {
                    form.setValue('responsiveness', values[0]);
                    const delay = getDefaultDelay(values[0]);
                    form.setValue('responseDelayMin', delay.min);
                    form.setValue('responseDelayMax', delay.max);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}