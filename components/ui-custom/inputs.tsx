import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search as SearchIcon, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

// ==========================================
// 1. SEARCH BOX
// ==========================================
interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  className?: string;
}

export const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ className, onClear, value, onChange, ...props }, ref) => {
    const showClear = value !== undefined && value !== null && String(value).length > 0;

    return (
      <div className="relative w-full">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            'pl-10 pr-10 h-10 w-full rounded-xl border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/60 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-600 text-sm font-sans transition-all placeholder:text-neutral-400 dark:placeholder:text-zinc-600',
            className
          )}
          {...props}
        />
        {showClear && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SearchBox.displayName = 'SearchBox';

// ==========================================
// 2. STYLED HTML5 DATE PICKER
// ==========================================
interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 pl-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            ref={ref}
            type="date"
            className={cn(
              'pl-10 h-10 w-full rounded-xl border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/60 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-600 text-sm font-sans transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium dark:text-neutral-100',
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

// ==========================================
// 3. CUSTOM SELECT CONTROL
// ==========================================
interface SelectBoxProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export const SelectBox = React.forwardRef<HTMLSelectElement, SelectBoxProps>(
  ({ className, label, options, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 pl-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={cn(
              'h-10 w-full rounded-xl border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/60 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-zinc-600 text-sm px-3.5 font-sans transition-all text-neutral-800 dark:text-neutral-100 appearance-none pr-8 cursor-pointer',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-950">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom SVG Arrow */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500">
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
SelectBox.displayName = 'SelectBox';

// ==========================================
// 4. CHECKBOX / RADIO
// ==========================================
interface SelectionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, SelectionInputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300 font-sans select-none select-none pl-0.5">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            'w-4 h-4 rounded border-neutral-300 bg-white text-neutral-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-800 dark:bg-zinc-950/60 cursor-pointer accent-neutral-800 dark:accent-neutral-200 transition-all',
            className
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export const Radio = React.forwardRef<HTMLInputElement, SelectionInputProps>(
  ({ className, label, id, name, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300 font-sans select-none select-none pl-0.5">
        <input
          ref={ref}
          type="radio"
          id={id}
          name={name}
          className={cn(
            'w-4 h-4 rounded-full border-neutral-300 bg-white text-neutral-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-800 dark:bg-zinc-950/60 cursor-pointer accent-neutral-800 dark:accent-neutral-200 transition-all',
            className
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  }
);
Radio.displayName = 'Radio';
