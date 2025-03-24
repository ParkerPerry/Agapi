import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { CollectiveFormValues } from "../simplified-collective-form";

interface NamingOptionsSectionProps {
  control: Control<CollectiveFormValues>;
  namingOption: string;
}

export function NamingOptionsSection({ control, namingOption }: NamingOptionsSectionProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="namingOption"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Naming Method</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select naming method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="sequential">Sequential (Team Alpha 1, Team Alpha 2...)</SelectItem>
                <SelectItem value="dynamic">Dynamic (AI-generated unique names)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How to name followers in this collective
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {namingOption === 'dynamic' && (
        <FormField
          control={control}
          name="generateDynamicAvatars"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Generate Unique Avatars</FormLabel>
                <FormDescription>
                  Create unique avatars for each AI follower
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {namingOption === 'sequential' && (
        <FormField
          control={control}
          name="avatarPrefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL Prefix (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar" {...field} />
              </FormControl>
              <FormDescription>
                Will be used like: prefix-1.png, prefix-2.png, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}