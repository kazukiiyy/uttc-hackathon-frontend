import './Loading.css';

interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = '読み込み中...' }: LoadingProps) => {
  return (
    <div className="loading-screen">
      {message}
    </div>
  );
};
