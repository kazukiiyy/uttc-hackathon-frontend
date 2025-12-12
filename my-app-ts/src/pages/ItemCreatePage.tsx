import { ItemCreateForm } from '../features/items/components/ItemCreateForm';
import './ItemCreatePage.css';

export const ItemCreatePage = () => {
  return (
    <div className="item-create-page">
      <header className="item-create-header">
        商品の情報を入力
      </header>

      <main className="item-create-main">
        <ItemCreateForm />
      </main>
    </div>
  );
};
