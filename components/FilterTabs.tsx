'use client'

export type FilterType = 'todos' | 'venda' | 'troca' | 'doacao' | 'preciso'

interface Tab {
  key: FilterType
  label: string
  color: string
  activeColor: string
  count?: number
}

interface FilterTabsProps {
  active: FilterType
  onChange: (f: FilterType) => void
  counts?: Partial<Record<FilterType, number>>
}

const TABS: Tab[] = [
  { key: 'todos',  label: 'Todos',  color: 'text-slate-500', activeColor: 'bg-slate-700 text-white' },
  { key: 'venda',  label: 'Venda',  color: 'text-green-600',  activeColor: 'bg-green-500 text-white' },
  { key: 'troca',  label: 'Troca',  color: 'text-blue-600',   activeColor: 'bg-blue-500 text-white' },
  { key: 'doacao', label: 'Doação', color: 'text-purple-600', activeColor: 'bg-purple-500 text-white' },
  { key: 'preciso',label: 'Preciso',color: 'text-red-600',    activeColor: 'bg-red-500 text-white' },
]

export default function FilterTabs({ active, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        const count = counts?.[tab.key]
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
              isActive
                ? tab.activeColor + ' shadow-sm'
                : 'bg-white border border-slate-200 ' + tab.color + ' hover:border-slate-300',
            ].join(' ')}
          >
            {tab.label}
            {count !== undefined && (
              <span className={[
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                isActive ? 'bg-white/30' : 'bg-slate-100 text-slate-600',
              ].join(' ')}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
