// components/professionals/MultiDateTimeDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarRange } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";

export interface DateTimeSelection {
  dateRange: DateRange | undefined;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: DateTimeSelection;
  onApply: (selection: DateTimeSelection) => void;
}

export function MultiDateTimeDialog({
  open,
  onOpenChange,
  selection,
  onApply,
}: Props) {
  // Use local state for internal selections until applied
  const [localSelection, setLocalSelection] = useState<DateTimeSelection>(selection);

  // Sync with prop when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelection(selection);
    }
  }, [open, selection]);

  const handleClearAll = () => {
    setLocalSelection({
      dateRange: undefined,
    });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setLocalSelection({
      dateRange: range,
    });
  };

  const getSelectedDatesCount = (): number => {
    if (localSelection.dateRange?.from) {
      if (localSelection.dateRange.to) {
        try {
          return eachDayOfInterval({
            start: localSelection.dateRange.from,
            end: localSelection.dateRange.to,
          }).length;
        } catch {
          return 1;
        }
      }
      return 1;
    }
    return 0;
  };

  const formatDateSummary = (): string => {
    const count = getSelectedDatesCount();
    if (count === 0) return "No dates selected";

    if (localSelection.dateRange?.from) {
      if (localSelection.dateRange.to) {
        return `${format(localSelection.dateRange.from, "MMM d")} - ${format(localSelection.dateRange.to, "MMM d, yyyy")}`;
      }
      return format(localSelection.dateRange.from, "MMM d, yyyy");
    }

    return "No dates selected";
  };

  const hasSelection = getSelectedDatesCount() > 0;

  const handleApply = () => {
    onApply(localSelection);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-[#F3CFC6]" />
            Select Date Range
          </DialogTitle>
          <DialogDescription>
            Choose a date range to filter professional session activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Selected Range Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Selected Range</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-destructive hover:text-destructive h-auto py-1"
                disabled={!hasSelection}
              >
                Clear range
              </Button>
            </div>
            {hasSelection ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-[#F3CFC6]/20 text-black dark:text-white"
                >
                  {localSelection.dateRange?.from && format(localSelection.dateRange.from, "MMM d, yyyy")}
                  {localSelection.dateRange?.to && (
                    <>
                      {" → "}
                      {format(localSelection.dateRange.to, "MMM d, yyyy")}
                    </>
                  )}
                </Badge>
                {localSelection.dateRange?.to && (
                  <span className="text-xs text-muted-foreground">
                    ({getSelectedDatesCount()} days)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No range selected</p>
            )}
          </div>

          {/* Calendar for Date Range */}
          <div className="border rounded-lg p-4">
            <Calendar
              mode="range"
              selected={localSelection.dateRange}
              onSelect={handleDateRangeSelect}
              className="mx-auto"
              aria-label="Select date range"
              numberOfMonths={1}
              modifiersStyles={{
                range_start: {
                  backgroundColor: "#F3CFC6",
                  color: "black",
                },
                range_end: {
                  backgroundColor: "#F3CFC6",
                  color: "black",
                },
                range_middle: {
                  backgroundColor: "#F3CFC6",
                  opacity: 0.5,
                  color: "black",
                },
              }}
            />
            <p className="text-xs text-center text-muted-foreground mt-2">
              Click to select start date, then click again to select end date
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Filter Summary</p>
            <p className="text-xs text-muted-foreground">
              <strong>Dates:</strong> {formatDateSummary()}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-[#F3CFC6] text-black hover:bg-[#F3CFC6]/80"
              disabled={!hasSelection}
            >
              Apply Filter
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get all dates from a selection
export function getSelectedDatesArray(selection: DateTimeSelection): Date[] {
  if (selection.dateRange?.from) {
    if (selection.dateRange.to) {
      return eachDayOfInterval({
        start: selection.dateRange.from,
        end: selection.dateRange.to,
      });
    }
    return [selection.dateRange.from];
  }
  return [];
}

// Default selection state
export const defaultDateTimeSelection: DateTimeSelection = {
  dateRange: undefined,
};
