// ./api.ts (例：Firestoreを利用する場合のイメージ)
import { firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * アプリケーションのユーザーDBにユーザーが登録済みかを確認する
 * @param uid Firebase UID
 * @returns 登録済みであれば true, 未登録であれば false
 */
export const checkUserExistenceAndProfile = async (uid: string): Promise<boolean> => {
    try {
        // 'users' コレクションから、UIDをドキュメントIDとして検索
        const userDocRef = doc(firestore, "users", uid);
        const userDoc = await getDoc(userDocRef);

        // ドキュメントが存在し、必要なプロフィール情報（例としてnickname）があれば登録済みと見なす
        return userDoc.exists() && userDoc.data()?.nickname != null;

    } catch (error) {
        console.error("DBチェックエラー:", error);
        // DBエラーが発生した場合は、念のため未登録として扱うか、エラーを返す
        return false; 
    }
};