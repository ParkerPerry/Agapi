import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Control } from "react-hook-form";
import { CollectiveFormValues } from "../simplified-collective-form";

interface BasicInfoSectionProps {
  control: Control<CollectiveFormValues>;
}

export function BasicInfoSection({ control }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="collectiveName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Collective Name</FormLabel>
            <FormControl>
              <Input placeholder="Team Alpha" {...field} />
            </FormControl>
            <FormDescription>
              This name will be used as a base for all followers in this collective
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="personality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Collective Personality</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Analytical and detail-oriented, each member brings a different perspective while maintaining core values of precision and thoughtfulness."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Describe the shared personality traits for this collective
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="count"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Followers ({field.value})</FormLabel>
            <FormControl>
              <Slider
                min={2}
                max={100}
                step={1}
                value={[field.value]}
                onValueChange={(values) => field.onChange(values[0])}
              />
            </FormControl>
            <FormDescription>
              How many followers to create (2-100)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}