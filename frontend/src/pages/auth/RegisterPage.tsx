import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Select, FormField } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

const ENTITY_TYPES = [
  { value: 'individual',    label: 'Individual Investor' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'institution',   label: 'Institutional Investor' },
  { value: 'esg_fund',      label: 'ESG Fund' },
];

const COUNTRIES = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' }, { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' }, { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'IT', name: 'Italy' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' }, { code: 'US', name: 'United States' },
];

interface FormState {
  email: string; password: string; confirmPassword: string;
  firstName: string; lastName: string;
  entityType: string; countryCode: string; jurisdiction: string;
}

const INITIAL: FormState = {
  email: '', password: '', confirmPassword: '',
  firstName: '', lastName: '',
  entityType: 'individual', countryCode: '', jurisdiction: '',
};

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Must include a lowercase letter';
  if (!/\d/.test(pw)) return 'Must include a number';
  if (!/[!@#$%^&*]/.test(pw)) return 'Must include a special character (!@#$%^&*)';
  return null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState & { general: string }>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const errs: Partial<FormState & { general: string }> = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.entityType) errs.entityType = 'Required';
    if (!form.countryCode) errs.countryCode = 'Required';
    if (!form.jurisdiction.trim()) errs.jurisdiction = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { message } = await register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        entityType: form.entityType, countryCode: form.countryCode,
        jurisdiction: form.jurisdiction,
      });
      setSuccess(message);
    } catch (err) {
      setErrors({ general: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-rebijoux-beige flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-serif font-semibold text-gray-900">Check your email</h2>
          <p className="mt-3 text-sm text-gray-500">{success}</p>
          <button onClick={() => navigate('/login')} className="mt-6 text-rebijoux-teal hover:underline text-sm">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rebijoux-beige flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-rebijoux-teal">Rebijoux</h1>
          <p className="mt-1 text-sm text-gray-500">Create your ReGold investor account</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-6">Create account</h2>

          {errors.general && <div className="mb-4"><Alert type="error" message={errors.general} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" required error={errors.firstName}>
                <Input value={form.firstName} onChange={set('firstName')} placeholder="Jean" error={errors.firstName} />
              </FormField>
              <FormField label="Last name" required error={errors.lastName}>
                <Input value={form.lastName} onChange={set('lastName')} placeholder="Dupont" error={errors.lastName} />
              </FormField>
            </div>

            <FormField label="Email address" required error={errors.email}>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="jean@familyoffice.fr" autoComplete="email" error={errors.email} />
            </FormField>

            <FormField label="Password" required error={errors.password}>
              <Input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 chars, upper, lower, digit, special" autoComplete="new-password" error={errors.password} />
              <p className="mt-1 text-xs text-gray-400">Must contain uppercase, lowercase, a number, and one of !@#$%^&*</p>
            </FormField>

            <FormField label="Confirm password" required error={errors.confirmPassword}>
              <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" autoComplete="new-password" error={errors.confirmPassword} />
            </FormField>

            <FormField label="Investor type" required error={errors.entityType}>
              <Select value={form.entityType} onChange={set('entityType')} error={errors.entityType}>
                {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Country" required error={errors.countryCode}>
                <Select value={form.countryCode} onChange={set('countryCode')} error={errors.countryCode}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Tax jurisdiction" required error={errors.jurisdiction}>
                <Input value={form.jurisdiction} onChange={set('jurisdiction')} placeholder="e.g. France" error={errors.jurisdiction} />
              </FormField>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-rebijoux-teal hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
