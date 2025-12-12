import { useState, useCallback } from 'react';
import type { RegisterFormData, Sex } from '../../../types';
import './RegisterForm.css';

const SEX_OPTIONS = [
  { value: 'unspecified', label: '選択しない' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

interface RegisterFormProps {
  initialEmail: string | null;
  initialDisplayName: string | null;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}

export const RegisterForm = ({
  initialEmail,
  initialDisplayName,
  onSubmit,
  isLoading,
  errorMessage,
}: RegisterFormProps) => {
  const [nickname, setNickname] = useState(initialDisplayName || '');
  const [sex, setSex] = useState<Sex>('unspecified');
  const [birthyear, setBirthyear] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [inputError, setInputError] = useState('');

  const validateForm = useCallback((): boolean => {
    setInputError('');

    if (!nickname.trim()) {
      setInputError('ニックネームは必須入力です。');
      return false;
    }

    const year = parseInt(birthyear, 10);
    const date = parseInt(birthdate, 10);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setInputError('有効な生年を入力してください。');
      return false;
    }

    if (isNaN(date) || date < 101 || date > 1231) {
      setInputError('有効な誕生日を入力してください。（例: 1月25日 -> 125）');
      return false;
    }

    return true;
  }, [nickname, birthyear, birthdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) {
      return;
    }

    const dataToSend: RegisterFormData = {
      nickname: nickname.trim(),
      sex,
      birthyear,
      birthdate,
    };

    await onSubmit(dataToSend);
  };

  return (
    <div className="profile-form-wrapper">
      <form onSubmit={handleSubmit} className="register-form">
        <h3 className="form-title">プロフィール情報入力</h3>

        <div className="form-group">
          <label htmlFor="email">メールアドレス:</label>
          <input
            type="email"
            id="email"
            value={initialEmail || '設定されていません'}
            disabled
            className="disabled-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nickname">ニックネーム:</label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            placeholder="フリマで使用する名前"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex">性別:</label>
          <select
            id="sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group half-width">
          <label htmlFor="birthyear">生年 (西暦):</label>
          <input
            type="number"
            id="birthyear"
            value={birthyear}
            onChange={(e) => setBirthyear(e.target.value)}
            placeholder="例: 1990"
            required
          />
        </div>

        <div className="form-group half-width">
          <label htmlFor="birthdate">誕生日 (月日連番):</label>
          <input
            type="number"
            id="birthdate"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            placeholder="例: 1月25日 → 125"
            required
          />
        </div>

        {(inputError || errorMessage) && (
          <p className="error-message">{inputError || errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !!inputError}
          className="submit-button"
        >
          {isLoading ? '登録中...' : 'プロフィールを登録してはじめる'}
        </button>
      </form>
    </div>
  );
};
