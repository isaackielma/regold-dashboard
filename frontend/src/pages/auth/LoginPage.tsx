import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input, FormField } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, investor } = await login(email, password);
      signIn(token, investor);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-rebijoux-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-rebijoux-teal">Rebijoux</h1>
          <p className="mt-1 text-sm text-gray-500">ReGold Investor Dashboard</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-rebijoux-teal hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
