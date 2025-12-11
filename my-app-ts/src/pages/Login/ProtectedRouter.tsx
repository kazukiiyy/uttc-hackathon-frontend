// src/pages/Login/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import React from "react";
// 👈 useAuth フックをインポート
import { useAuth } from "../../features/firebase/useAuth"; 
import "../../components/ui/Loading.css"; // スタイルシートはそのまま

type Props = {
    children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
    // 🌟 カスタムフックから認証状態とローディング状態を取得
    const { user, loading } = useAuth(); 

    // user がまだ確認できていない（useAuth側で処理中）
    if (loading) {
        // user === undefined の状態に相当
        return <div className="loading-screen">Loading...</div>;
    }

    // user が null → ログインしていない
    // useAuthフックが onAuthStateChanged の結果を返すため、!user でチェック可能
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // ログインしている → children を表示
    // ログインユーザーのUIDは user.uid で取得できますが、
    // ProtectedRouteの責務はガードなので、ここでは children を返すだけです。
    return <>{children}</>;
};