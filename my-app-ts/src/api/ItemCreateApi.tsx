type itemData = {
  title: string;
  price: string;
  explanation: string;
  image: File | null; 
  sellerUid: string;
};

export const createItem = async (data: itemData) => {
  // 1. 画像を送るためには "FormData" という特殊な入れ物が必要
  const formData = new FormData();

  // 2. 入れ物にデータを詰める (キー名はバックエンドの要求に合わせる)
  formData.append('title', data.title);
  formData.append('price', data.price); // 数値に変換が必要ならここで Number(data.price)
  formData.append('explanation', data.explanation);

  // 画像がある場合のみ詰める
  if (data.image) {
    formData.append('image', data.image); 
  }

  // 3. fetchでバックエンドに送信
  // ※URLは自分のバックエンドのエンドポイントに合わせて書き換えてください
  const response = await fetch('https://hackathon-backend-982651832089.europe-west1.run.app/items', {
    method: 'POST',
    // FormDataを送る場合、Content-Typeヘッダーは自動設定されるので書かないのが正解！
    body: formData,
  });

  if (!response.ok) {
    throw new Error('出品に失敗しました');
  }

  return response.json();
};