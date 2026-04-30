import { BarChart3, Columns3, LayoutList, Settings, ShieldQuestion, Ticket } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Projects', icon: LayoutList, to: '/projects' },
  { label: 'Board', icon: Columns3, to: '/board' },
  { label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
  { label: 'Issues', icon: Ticket, to: '/board' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 bg-surface_container_low p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-surface_container_lowest">
          <Columns3 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-inverse_surface">
            Mini JIRA
          </h2>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-outline_variant/70">
            Product Team
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] leading-[1.6] transition-colors ${
                isActive
                  ? 'bg-surface_container_lowest text-primary shadow-air'
                  : 'text-outline_variant hover:bg-surface_container_high hover:text-inverse_surface'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <button className="mb-8 mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary_dim px-4 py-2.5 text-[13px] font-semibold text-surface_container_lowest shadow-air active:scale-[0.98] transition-transform">
        <span className="text-[18px] leading-none">+</span>
        Create Issue
      </button>

      <div className="space-y-1 border-t border-outline_variant/10 pt-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] leading-[1.6] text-outline_variant transition-colors hover:bg-surface_container_high hover:text-inverse_surface"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] leading-[1.6] text-outline_variant transition-colors hover:bg-surface_container_high hover:text-inverse_surface"
        >
          <ShieldQuestion className="h-[18px] w-[18px]" />
          Support
        </a>
      </div>
    </aside>
  )
}

