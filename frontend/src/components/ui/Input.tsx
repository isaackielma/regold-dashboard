import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className, ...rest }: InputProps) {
  return (
    <input
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-rebijoux-teal focus:border-rebijoux-teal',
        error ? 'border-red-400' : 'border-gray-300',
        className,
      )}
      {...rest}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export function Select({ error, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={clsx(
        'block w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-white',
        'focus:outline-none focus:ring-2 focus:ring-rebijoux-teal focus:border-rebijoux-teal',
        error ? 'border-red-400' : 'border-gray-300',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
