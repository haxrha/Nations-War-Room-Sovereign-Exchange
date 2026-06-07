import { BotStrategyPanel } from './BotStrategyPanel'
import { StrategyChat } from './StrategyChat'
import { cn } from '../../lib/cn'

export function BotTab() {
  return (
    <div className={cn('grid h-full min-h-0 gap-3', 'lg:grid-cols-[minmax(18rem,22rem)_1fr]')}>
      <StrategyChat className="min-h-[280px] lg:min-h-0" />
      <BotStrategyPanel className="min-h-0" />
    </div>
  )
}
