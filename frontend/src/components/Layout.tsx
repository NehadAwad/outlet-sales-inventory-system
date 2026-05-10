import { NavLink, Outlet } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
    isActive
      ? 'bg-neutral-200 font-medium text-neutral-900'
      : 'text-neutral-600 hover:bg-neutral-100',
  ].join(' ')

const navItems: { to: string; label: string }[] = [
  { to: '/outlets', label: 'Outlets' },
  { to: '/menu', label: 'Master menu' },
  { to: '/assign-menu', label: 'Assign menu' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/sales', label: 'Create sale' },
  { to: '/reports', label: 'Reports' },
]

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold tracking-tight">Outlet POS</p>
          <nav aria-label="Main" className="flex flex-wrap gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
