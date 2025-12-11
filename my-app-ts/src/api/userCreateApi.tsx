export interface UserProfilePayload {
  uid: string; // Firebase UIDは文字列
  sex: 'male' | 'female' | 'other' | 'unspecified'; // 性別を想定される文字列リテラルで定義
  nickname: string;
  birthyear: number; // 生年（例: 1990）
  birthdate: number; // 誕生日（例: 125 -> 1月25日、または月と日を合わせた数値）
}

export const PostUser = async (payload: UserProfilePayload): Promise<any> => {
  const url = 'https://hackathon-backend-982651832089.europe-west1.run.app/user'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 認証トークンが必要な場合はここに追加
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorData = await response.json().catch(() => ({ message: '不明なエラー' }));
      console.error('APIエラーレスポンス:', response.status, errorData);
      throw new Error(`プロフィール登録に失敗しました: ${errorData.message || response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('ネットワーク/Fetchエラー:', error);
    throw new Error(`プロフィール登録中に予期せぬエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};