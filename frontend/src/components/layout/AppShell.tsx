import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/tax-lots',     label: 'Tax Lots' },
  { to: '/esg',          label: 'ESG Impact' },
  { to: '/reports',      label: 'Reports' },
  { to: '/trade',        label: 'Trade' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { investor, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-rebijoux-beige">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-serif font-bold text-rebijoux-teal">Rebijoux</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider pt-1">ReGold Dashboard</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition',
                    isActive
                      ? 'text-rebijoux-teal bg-rebijoux-teal/5 border-b-2 border-rebijoux-teal rounded-b-none'
                      : 'text-gray-600 hover:text-rebijoux-teal hover:bg-gray-50',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {investor?.firstName} {investor?.lastName}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-rebijoux-teal transition px-3 py-1.5 rounded-md hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
