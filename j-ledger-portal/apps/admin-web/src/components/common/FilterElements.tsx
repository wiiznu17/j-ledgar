'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * FilterLabel - Standardized small uppercase label for filters
 */
export const FilterLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
    {children}
  </label>
);

/**
 * FilterField - Wrapper for a single filter field with a label
 */
export const FilterField = ({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col ${className}`}>
    <FilterLabel>{label}</FilterLabel>
    {children}
  </div>
);

/**
 * FilterSearchInput - Input field with search icon for filters
 */
interface FilterSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const FilterSearchInput = ({ label, ...props }: FilterSearchInputProps) => (
  <div className="flex flex-col gap-1.5">
    {label && <FilterLabel>{label}</FilterLabel>}
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        {...props}
        className={`pl-9 h-10 w-full text-xs border-slate-200 focus:ring-indigo-500 rounded-lg bg-white shadow-sm font-medium ${props.className || ''}`}
      />
    </div>
  </div>
);

/**
 * FilterSelect - Standardized Select component for filters
 */
interface FilterSelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { label: string; value: string; className?: string }[];
  className?: string;
}

export const FilterSelect = ({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  className = '',
}: FilterSelectProps) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <FilterLabel>{label}</FilterLabel>}
    <Select value={value} onValueChange={(val) => onValueChange(val || '')}>
      <SelectTrigger className="w-full bg-white border-slate-200 !h-10 shadow-sm rounded-lg font-bold text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-lg border-slate-100 shadow-xl">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={`text-xs font-medium ${opt.className || ''}`}
          >
            {opt.label.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * FilterActions - Reset and Search button group
 */
interface FilterActionsProps {
  onReset: () => void;
  isLoading?: boolean;
  searchLabel?: string;
  className?: string;
}

export const FilterActions = ({
  onReset,
  isLoading,
  searchLabel = 'Search',
  className = '',
}: FilterActionsProps) => (
  <div className={`flex gap-2 w-full h-10 ${className}`}>
    <Button
      type="button"
      variant="outline"
      onClick={onReset}
      className="flex-1 h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border-slate-200 transition-all"
    >
      <RotateCcw className="w-4 h-4 mr-1" />
      Reset
    </Button>
    <Button
      type="submit"
      disabled={isLoading}
      className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
    >
      <Search className="w-4 h-4 mr-1" />
      {searchLabel}
    </Button>
  </div>
);

/**
 * FilterDatePicker - Standardized Date Picker component for filters
 */
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface FilterDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FilterDatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Pick date',
  className = '',
}: FilterDatePickerProps) => (
  <FilterField label={label} className={className}>
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={`w-full h-10 justify-start text-left font-medium text-xs bg-white border-slate-200 rounded-lg shadow-sm ${!value && 'text-slate-400'}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              {value ? format(new Date(value), 'MMM d, yyyy') : placeholder}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </FilterField>
);
