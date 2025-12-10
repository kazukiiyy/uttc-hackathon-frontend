import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect , useState } from "react";
import { fireAuth } from "../../firebase";
import React from "react";
import "../../css/Loading.css"

type Props = {
    children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
    const [user, setUser] = useState<any>(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(fireAuth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    // user がまだ undefined → 読み込み中
    if (user === undefined) {
        return <div className="loading-screen">Loading...</div>;
    }

    // user が null → ログインしていない
    if (user === null) {
        return <Navigate to="/login" replace />;
    }

    // ログインしている → children を表示
    return <>{children}</>;
};