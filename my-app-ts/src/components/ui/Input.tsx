import { InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    const classNames = [
      'input-field',
      fullWidth ? 'input-full-width' : '',
      error ? 'input-error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`input-wrapper ${fullWidth ? 'input-wrapper-full-width' : ''}`}>
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames}
          {...props}
        />
        {error && <span className="input-error-message">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
