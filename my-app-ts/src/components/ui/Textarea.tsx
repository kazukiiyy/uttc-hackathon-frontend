import { TextareaHTMLAttributes, forwardRef } from 'react';
import './Textarea.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name;
    const classNames = [
      'textarea-field',
      fullWidth ? 'textarea-full-width' : '',
      error ? 'textarea-error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`textarea-wrapper ${fullWidth ? 'textarea-wrapper-full-width' : ''}`}>
        {label && (
          <label className="textarea-label" htmlFor={textareaId}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={classNames}
          {...props}
        />
        {error && <span className="textarea-error-message">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
