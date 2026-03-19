import * as React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { TabId } from '../../types'

interface DockItem {
  id: TabId
  icon: LucideIcon
  label: string
  onClick?: () => void
}

interface DockProps {
  items: DockItem[]
  activeTab: TabId
  className?: string
}

interface DockIconButtonProps {
  item: DockItem
  isActive: boolean
}


function DockIconButton({ item, isActive }: DockIconButtonProps) {
  const Icon = item.icon
  return (
    <motion.button
      whileHover={{ scale: 1.12, y: -2 }}
      whileTap={{ scale: 0.93 }}
      onClick={item.onClick}
      className={cn(
        'relative group flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors',
        isActive ? 'bg-accent' : 'hover:bg-secondary',
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <span
        className={cn(
          'text-[10px] font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {item.label}
      </span>
      {isActive && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
      {/* Tooltip on hover (desktop) */}
      <span
        className={cn(
          'absolute -top-9 left-1/2 -translate-x-1/2',
          'px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none',
          'bg-popover text-popover-foreground border border-border shadow-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity',
        )}
      >
        {item.label}
      </span>
    </motion.button>
  )
}

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, activeTab, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 flex items-end justify-center pb-4 pt-2 pointer-events-none',
          className,
        )}
      >
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-2xl pointer-events-auto',
            'border border-border shadow-lg',
            'bg-card backdrop-blur-lg',
          )}
        >
          {items.map((item) => (
            <DockIconButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
            />
          ))}
        </div>
      </div>
    )
  },
)
Dock.displayName = 'Dock'
