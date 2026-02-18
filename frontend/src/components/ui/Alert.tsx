import clsx from 'clsx';

interface Props {
  type: 'success' | 'error' | 'info';
  message: string;
}

const styles = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
};

export function Alert({ type, message }: Props) {
  return (
    <div className={clsx('border rounded-md px-4 py-3 text-sm', styles[type])}>
      {message}
    </div>
  );
}
