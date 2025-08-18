import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, getCategoriesByType } from "@/lib/categories";

interface CategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  type: 'income' | 'expense';
  placeholder?: string;
  className?: string;
}

export function CategorySelector({
  value,
  onValueChange,
  type,
  placeholder = "Seleccionar categoría",
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const categories = getCategoriesByType(type);
  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="grid grid-cols-2 gap-1 p-2 max-h-[300px] overflow-y-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "justify-start h-auto p-3 flex-col items-start gap-2",
                value === category.id && "bg-accent"
              )}
              onClick={() => {
                onValueChange(category.id);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
                {value === category.id && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 