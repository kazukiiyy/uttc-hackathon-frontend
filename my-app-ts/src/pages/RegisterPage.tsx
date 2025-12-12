import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { userApi } from '../api';
import { RegisterForm } from '../features/user/components/RegisterForm';
import { Loading } from '../components/ui';
import type { RegisterFormData, UserProfilePayload } from '../types';
import './RegisterPage.css';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      alert('ログインが必要です。');
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const handleProfileSubmit = useCallback(
    async (data: RegisterFormData) => {
      setError('');

      if (!user) {
        setError('ユーザー情報が取得できません。再度ログインしてください。');
        return;
      }

      try {
        setIsSubmitting(true);

        const payload: UserProfilePayload = {
          uid: user.uid,
          nickname: data.nickname,
          sex: data.sex,
          birthyear: parseInt(data.birthyear, 10),
          birthdate: parseInt(data.birthdate, 10),
        };

        await userApi.register(payload);

        alert('プロフィール登録が完了しました！');
        navigate('/');
      } catch (err) {
        console.error('プロフィール登録エラー:', err);
        setError(err instanceof Error ? err.message : '不明な登録エラーが発生しました。');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, navigate]
  );

  if (authLoading) {
    return <Loading message="認証情報を確認中..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="register-page-container">
      <h1 className="register-page-title">新規ユーザー登録</h1>

      <RegisterForm
        initialEmail={user.email}
        initialDisplayName={user.displayName}
        onSubmit={handleProfileSubmit}
        isLoading={isSubmitting}
        errorMessage={error}
      />
    </div>
  );
};
