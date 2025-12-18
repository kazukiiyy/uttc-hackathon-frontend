// シェア機能ユーティリティ

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

// Web Share APIが利用可能かチェック
export const canUseWebShare = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

// システムシェアを実行
export const shareNative = async (data: ShareData): Promise<boolean> => {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    // ユーザーがキャンセルした場合はエラーにしない
    if (err instanceof Error && err.name === 'AbortError') {
      return true;
    }
    console.error('Share failed:', err);
    return false;
  }
};

// X(Twitter)でシェア
export const shareToTwitter = (data: ShareData): void => {
  const text = encodeURIComponent(`${data.title}\n${data.text}`);
  const url = encodeURIComponent(data.url);
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    '_blank',
    'noopener,noreferrer'
  );
};

// LINEでシェア
export const shareToLine = (data: ShareData): void => {
  const text = encodeURIComponent(`${data.title}\n${data.text}\n${data.url}`);
  window.open(
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(data.url)}&text=${text}`,
    '_blank',
    'noopener,noreferrer'
  );
};

// クリップボードにコピー
export const copyToClipboard = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};
