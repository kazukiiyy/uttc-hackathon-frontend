// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
// 認証インスタンスをインポート
import { fireAuth } from "../../firebase"; // 👈 fireAuth をインポートする

/**
 * 認証ユーザーの情報を取得するカスタムフック
 * @returns {{ user: User | null, loading: boolean }}
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 認証状態の変更を購読
    const unsubscribe = onAuthStateChanged(fireAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  return { user, loading };
};