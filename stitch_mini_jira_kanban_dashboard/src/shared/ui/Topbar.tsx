import { Bell, HelpCircle, Search, Settings } from 'lucide-react'

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface/80 px-8 py-3 backdrop-blur-xl shadow-air">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold tracking-tighter text-inverse_surface">
          Lucid
        </span>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-outline_variant" />
          <input
            className="w-72 rounded-full bg-surface_container_low py-1.5 pl-10 pr-4 text-sm placeholder:text-outline_variant focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search tasks, sprints..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-outline_variant">
          <button className="rounded-full p-2 transition-colors hover:bg-surface_container_low">
            <Bell className="h-[22px] w-[22px]" />
          </button>
          <button className="rounded-full p-2 transition-colors hover:bg-surface_container_low">
            <HelpCircle className="h-[22px] w-[22px]" />
          </button>
          <button className="rounded-full p-2 transition-colors hover:bg-surface_container_low">
            <Settings className="h-[22px] w-[22px]" />
          </button>
        </div>
        <div className="mx-1 h-8 w-px bg-outline_variant/20" />
        <div className="h-8 w-8 rounded-full bg-surface_container_high ring-2 ring-surface shadow-air" />
      </div>
    </header>
  )
}

