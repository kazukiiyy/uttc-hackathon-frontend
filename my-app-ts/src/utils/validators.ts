export const validators = {
  required: (value: string, fieldName: string = 'この項目'): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName}は必須です`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string = 'この項目'): string | null => {
    if (value.length < min) {
      return `${fieldName}は${min}文字以上で入力してください`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string = 'この項目'): string | null => {
    if (value.length > max) {
      return `${fieldName}は${max}文字以下で入力してください`;
    }
    return null;
  },

  isNumber: (value: string, fieldName: string = 'この項目'): string | null => {
    if (isNaN(Number(value))) {
      return `${fieldName}は数値で入力してください`;
    }
    return null;
  },

  isPositiveNumber: (value: string, fieldName: string = 'この項目'): string | null => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName}は正の数値で入力してください`;
    }
    return null;
  },

  inRange: (value: string, min: number, max: number, fieldName: string = 'この項目'): string | null => {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return `${fieldName}は${min}から${max}の間で入力してください`;
    }
    return null;
  },

  isValidYear: (value: string): string | null => {
    const num = Number(value);
    const currentYear = new Date().getFullYear();
    if (isNaN(num) || num < 1900 || num > currentYear) {
      return `生年は1900から${currentYear}の間で入力してください`;
    }
    return null;
  },

  isValidBirthdate: (value: string): string | null => {
    const num = Number(value);
    if (isNaN(num) || num < 101 || num > 1231) {
      return '誕生日は101（1月1日）から1231（12月31日）の間で入力してください';
    }
    return null;
  },

  isValidPrice: (value: string): string | null => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return '価格は0以上の数値で入力してください';
    }
    return null;
  },
};

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export const validateForm = <T extends Record<string, string>>(
  data: T,
  rules: Record<keyof T, ((value: string) => string | null)[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field as keyof T];
    for (const validate of validators as ((value: string) => string | null)[]) {
      const error = validate(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
