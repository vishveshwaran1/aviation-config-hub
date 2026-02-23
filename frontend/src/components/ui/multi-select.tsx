import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface Option {
    label: string;
    value: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    /** Allow the user to type and create new values not in the options list */
    creatable?: boolean;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
    creatable = false,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    // Merge static options with any selected values that were created ad-hoc
    const allOptions = React.useMemo(() => {
        const createdValues = selected.filter(
            (v) => !options.some((o) => o.value === v)
        );
        return [
            ...options,
            ...createdValues.map((v) => ({ label: v, value: v })),
        ];
    }, [options, selected]);

    const handleSelect = (value: string) => {
        const isSelected = selected.includes(value);
        if (isSelected) {
            onChange(selected.filter((item) => item !== value));
        } else {
            onChange([...selected, value]);
        }
        setInputValue("");
    };

    const handleCreate = () => {
        const trimmed = inputValue.trim();
        if (!trimmed || selected.includes(trimmed)) return;
        onChange([...selected, trimmed]);
        setInputValue("");
    };

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((item) => item !== value));
    };

    const showCreate =
        creatable &&
        inputValue.trim().length > 0 &&
        !allOptions.some(
            (o) => o.value.toLowerCase() === inputValue.trim().toLowerCase()
        );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-[36px] text-left font-normal", className)}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.length > 0 ? (
                            selected.map((item) => (
                                <Badge
                                    variant="secondary"
                                    key={item}
                                    className="mr-1 pr-1 flex items-center gap-1"
                                >
                                    {allOptions.find((o) => o.value === item)?.label || item}
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        className="ml-1 rounded-full hover:bg-muted cursor-pointer"
                                        onMouseDown={(e) => handleRemove(item, e)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onChange(selected.filter((v) => v !== item));
                                            }
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-sm">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder={creatable ? "Search or type to create..." : "Search..."}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        {!showCreate && <CommandEmpty>No item found.</CommandEmpty>}
                        {showCreate && (
                            <CommandGroup heading="Create">
                                <CommandItem
                                    value={`__create__${inputValue}`}
                                    onSelect={handleCreate}
                                    className="text-blue-600 font-medium"
                                >
                                    + Create &quot;{inputValue.trim()}&quot;
                                </CommandItem>
                            </CommandGroup>
                        )}
                        <CommandGroup>
                            {allOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
