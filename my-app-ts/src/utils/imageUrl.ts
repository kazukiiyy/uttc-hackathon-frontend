import { config } from '../config/env';

/**
 * 相対パスの画像URLをフルURLに変換する
 */
export const getFullImageUrl = (imageUrl: string): string => {
  // すでにhttpで始まっている場合はそのまま返す
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // 相対パスの場合はAPIベースURLと結合
  return `${config.apiBaseUrl}/${imageUrl}`;
};
