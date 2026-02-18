import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../services/api';
import { PageLoader } from '../../components/ui/Spinner';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check the link in your email.');
      return;
    }
    verifyEmail(token)
      .then(({ message: msg }) => { setMessage(msg); setStatus('success'); })
      .catch((err: Error) => { setMessage(err.message); setStatus('error'); });
  }, [params]);

  if (status === 'loading') return <PageLoader />;

  return (
    <div className="min-h-screen bg-rebijoux-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-4">{status === 'success' ? '✅' : '❌'}</div>
        <h2 className="text-xl font-serif font-semibold text-gray-900">
          {status === 'success' ? 'Email verified' : 'Verification failed'}
        </h2>
        <p className="mt-3 text-sm text-gray-500">{message}</p>
        <Link to="/login" className="mt-6 inline-block text-rebijoux-teal hover:underline text-sm">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
