import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fireAuth } from '../firebase';
import {
  getUserProfile,
  saveUserProfile,
  uploadProfileImage,
} from '../api/firestore/userProfile';
import { FirestoreUserProfile } from '../types';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const user = fireAuth.currentUser;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const data = await getUserProfile(user.uid);
        if (data) {
          setProfile(data);
          setNickname(data.nickname);
          setBio(data.bio);
          setProfileImageUrl(data.profileImageUrl);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('プロフィールの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('ログインしてください');
      return;
    }

    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let imageUrl = profileImageUrl;

      if (selectedFile) {
        imageUrl = await uploadProfileImage(user.uid, selectedFile);
      }

      await saveUserProfile(user.uid, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        profileImageUrl: imageUrl,
      });

      setProfileImageUrl(imageUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccessMessage('プロフィールを保存しました');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('プロフィールの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>プロフィール編集</h1>
      </header>

      <main className="profile-main">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-image-section">
            <div className="profile-image-container" onClick={handleImageClick}>
              {previewUrl || profileImageUrl ? (
                <img
                  src={previewUrl || profileImageUrl}
                  alt="プロフィール画像"
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>画像を選択</span>
                </div>
              )}
              <div className="profile-image-overlay">
                <span>変更</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="profile-file-input"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="nickname">ニックネーム</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力"
              maxLength={20}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="bio">自己紹介</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力"
              rows={4}
              maxLength={200}
            />
            <span className="char-count">{bio.length}/200</span>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {successMessage && <p className="profile-success">{successMessage}</p>}

          <button
            type="submit"
            className="profile-submit-btn"
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存する'}
          </button>
        </form>
      </main>
    </div>
  );
};
