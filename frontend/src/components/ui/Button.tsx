import clsx from 'clsx';
import { Spinner } from './Spinner';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading = false, disabled, className, children, ...rest }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-rebijoux-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-rebijoux-teal text-white hover:bg-rebijoux-teal/90',
    secondary: 'border border-rebijoux-teal text-rebijoux-teal hover:bg-rebijoux-teal/5',
    ghost: 'text-gray-600 hover:text-rebijoux-teal hover:bg-gray-50',
  };
  return (
    <button className={clsx(base, variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
