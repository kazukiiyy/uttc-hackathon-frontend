import { SelectHTMLAttributes, forwardRef } from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  fullWidth?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, fullWidth = true, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;
    const classNames = [
      'select-field',
      fullWidth ? 'select-full-width' : '',
      error ? 'select-error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`select-wrapper ${fullWidth ? 'select-wrapper-full-width' : ''}`}>
        {label && (
          <label className="select-label" htmlFor={selectId}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={classNames}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="select-error-message">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
