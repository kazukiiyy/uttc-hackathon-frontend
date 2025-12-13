import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, fireStorage } from '../../firebase';
import { FirestoreUserProfile, FirestoreUserProfileInput } from '../../types';

const USERS_COLLECTION = 'users';

// プロフィール作成
export const createUserProfile = async (
  uid: string,
  data: FirestoreUserProfileInput
): Promise<void> => {
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await setDoc(userRef, {
    uid,
    nickname: data.nickname,
    profileImageUrl: data.profileImageUrl || '',
    bio: data.bio || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// プロフィール取得
export const getUserProfile = async (
  uid: string
): Promise<FirestoreUserProfile | null> => {
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid: data.uid,
    nickname: data.nickname,
    profileImageUrl: data.profileImageUrl,
    bio: data.bio,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// プロフィール更新
export const updateUserProfile = async (
  uid: string,
  data: Partial<FirestoreUserProfileInput>
): Promise<void> => {
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// プロフィール作成または更新
export const saveUserProfile = async (
  uid: string,
  data: FirestoreUserProfileInput
): Promise<void> => {
  const existing = await getUserProfile(uid);
  if (existing) {
    await updateUserProfile(uid, data);
  } else {
    await createUserProfile(uid, data);
  }
};

// プロフィール画像アップロード
export const uploadProfileImage = async (
  uid: string,
  file: File
): Promise<string> => {
  const storageRef = ref(fireStorage, `profile_images/${uid}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};
