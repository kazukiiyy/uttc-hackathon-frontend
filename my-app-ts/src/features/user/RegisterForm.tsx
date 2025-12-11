import React, { useState, useCallback, useMemo } from 'react';
import './RegisterForm'; 

export interface RegisterFormData {
    sex: 'male' | 'female' | 'other' | 'unspecified';
    nickname: string;
    birthyear: number;
    birthdate: number; 
}

const SEX_OPTIONS = [
  { value: 'unspecified', label: '選択しない' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

interface RegisterFormProps {
  initialEmail: string | null; 
  initialDisplayName: string | null;
  // onSubmitの引数も更新
  onSubmit: (data: RegisterFormData) => Promise<void>; 
  isLoading: boolean;
  errorMessage: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  initialEmail,
  initialDisplayName,
  onSubmit,
  isLoading,
  errorMessage,
}) => {
  // 状態管理
  const [nickname, setNickname] = useState(initialDisplayName || '');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'unspecified'>('unspecified');
  const [birthyearStr, setBirthyearStr] = useState('');
  const [birthdateStr, setBirthdateStr] = useState(''); 
  const [inputError, setInputError] = useState('');

  const validateForm = useCallback((): boolean => {
    setInputError(''); // エラーをクリア
    
    if (!nickname.trim()) {
      setInputError('ニックネームは必須入力です。');
      return false;
    }
    
    // 生年と誕生日が入力されているか、かつ数値として有効かチェック
    const year = parseInt(birthyearStr, 10);
    const date = parseInt(birthdateStr, 10);
    
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setInputError('有効な生年を入力してください。');
      return false;
    }

    // birthdateの簡易的なチェック（例: 101～1231の範囲など。詳細な日付チェックは省略）
    if (isNaN(date) || date < 101 || date > 1231) {
        setInputError('有効な誕生日を入力してください。（例: 1月25日 -> 125, 10月10日 -> 1010）');
        return false;
    }
    
    return true;
  }, [nickname, birthyearStr, birthdateStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) {
      return;
    }
    
    // データを数値型に変換
    const dataToSend: RegisterFormData = {
        nickname: nickname.trim(),
        sex: sex,
        birthyear: parseInt(birthyearStr, 10),
        birthdate: parseInt(birthdateStr, 10),
    };

    // 親コンポーネントにデータを渡し、登録処理を実行してもらう
    await onSubmit(dataToSend);
  };

    return (
    <div className="profile-form-wrapper">
      <form onSubmit={handleSubmit} className="register-form">
        <h3 className="form-title">プロフィール情報入力</h3>

        {/* 📧 メールアドレス */}
        <div className="form-group">
          <label htmlFor="email">メールアドレス:</label>
          <input
            type="email"
            id="email"
            value={initialEmail || "設定されていません"}
            disabled
            className="disabled-input"
          />
        </div>

        {/* 👤 ニックネーム */}
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

        {/* 🚻 性別 */}
        <div className="form-group">
          <label htmlFor="sex">性別:</label>
          <select
            id="sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
          >
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 🎂 生年 */}
        <div className="form-group half-width">
          <label htmlFor="birthyear">生年 (西暦):</label>
          <input
            type="number"
            id="birthyear"
            value={birthyearStr}
            onChange={(e) => setBirthyearStr(e.target.value)}
            placeholder="例: 1990"
            required
          />
        </div>

        {/* 🎁 誕生日 */}
        <div className="form-group half-width">
          <label htmlFor="birthdate">誕生日 (月日連番):</label>
          <input
            type="number"
            id="birthdate"
            value={birthdateStr}
            onChange={(e) => setBirthdateStr(e.target.value)}
            placeholder="例: 1月25日 → 125"
            required
          />
        </div>

        {/* ❌ エラーメッセージ */}
        {(inputError || errorMessage) && (
          <p className="error-message">{inputError || errorMessage}</p>
        )}

        {/* 🚀 登録ボタン */}
        <button
          type="submit"
          disabled={isLoading || !!inputError}
          className="submit-button"
        >
          {isLoading ? "登録中..." : "プロフィールを登録してはじめる"}
        </button>
      </form>
    </div>
  );
};

