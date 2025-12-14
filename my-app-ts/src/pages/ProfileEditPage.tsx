import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { getUserProfile, saveUserProfile, uploadProfileImage } from '../api/firestore/userProfile';
import { Button, Input, Textarea } from '../components/ui';
import './ProfileEditPage.css';

export const ProfileEditPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setNickname(profile.nickname);
          setBio(profile.bio || '');
          setProfileImageUrl(profile.profileImageUrl || '');
        }
      } catch (err) {
        console.error(err);
        setError('プロフィールの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let newImageUrl = profileImageUrl;

      // 画像がある場合はアップロード
      if (selectedFile) {
        newImageUrl = await uploadProfileImage(user.uid, selectedFile);
      }

      await saveUserProfile(user.uid, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        profileImageUrl: newImageUrl,
      });

      alert('プロフィールを更新しました');
      navigate('/mypage');
    } catch (err) {
      console.error(err);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-edit-page">
        <p className="loading-text">読み込み中...</p>
      </div>
    );
  }

  const displayImage = previewUrl || profileImageUrl;

  return (
    <div className="profile-edit-page">
      <header className="profile-edit-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 戻る
        </button>
        <h1>プロフィール編集</h1>
      </header>

      <main className="profile-edit-main">
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="image-edit-section">
            <div className="profile-image-wrapper" onClick={handleImageClick}>
              {displayImage ? (
                <img src={displayImage} alt="プロフィール" className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">
                  {nickname.charAt(0) || '?'}
                </div>
              )}
              <div className="image-overlay">
                <span>変更</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden-input"
            />
            <p className="image-hint">タップして画像を変更</p>
          </div>

          <div className="form-section">
            <Input
              label="ニックネーム"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力"
              required
            />

            <Textarea
              label="自己紹介"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力（任意）"
              rows={4}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="button-section">
            <Button type="submit" fullWidth disabled={isSaving}>
              {isSaving ? '保存中...' : '保存する'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
