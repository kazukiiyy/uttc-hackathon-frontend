// src/components/RegisterPage.tsx (最終修正版)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, onAuthStateChanged } from 'firebase/auth';
import { fireAuth } from '../firebase'; // 適切なパスに修正
import { PostUser, UserProfilePayload } from '../api/userCreateApi'; // PostUserに改名、型をインポート
import { RegisterForm, RegisterFormData } from '../features/user/RegisterForm'; 

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState(''); 

  // 認証状態の監視 (変更なし)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        alert('ログインが必要です。');
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);


  /**
   * フォームから受け取ったデータを使ってバックエンドAPIにPOST送信
   */
  const handleProfileSubmit = useCallback(async (data: RegisterFormData) => {
    setError('');
    
    if (!currentUser) {
      setError('ユーザー情報が取得できません。再度ログインしてください。');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // フォームデータとUIDを結合し、APIペイロードを作成
      const payload: UserProfilePayload = {
        uid: currentUser.uid,
        ...data, // nickname, sex, birthyear, birthdate が展開される
      };

      // 🚀 バックエンドAPIにデータを送信
      await PostUser(payload); // 新しい関数名を使用

      alert('プロフィール登録が完了しました！');
      navigate('/'); 

    } catch (err) {
      console.error('プロフィール登録エラー:', err);
      setError(err instanceof Error ? err.message : '不明な登録エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, navigate]);


  if (loading) {
    return <div>認証情報を確認中...</div>;
  }

  if (!currentUser) {
    return null; 
  }

  return (
    <div className="register-page-container">
      <h1>ようこそ！新規ユーザー登録</h1>
      
      <RegisterForm
        initialEmail={currentUser.email}
        initialDisplayName={currentUser.displayName}
        onSubmit={handleProfileSubmit}
        isLoading={isSubmitting}
        errorMessage={error}
      />
    </div>
  );
};

export default RegisterPage;