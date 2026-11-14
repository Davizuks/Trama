import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Icon } from '../ui/Icon.tsx'
import { resolveScreen, tabsFor } from './screens.ts'

export function ViewTabs() {
  const { layout } = useWorkspace()
  const { screen: asked, goTo } = useNavigation()
  const screen = resolveScreen(layout, asked)

  return (
    <nav className="linha abas-texto" aria-label="Áreas">
      {tabsFor(layout).map((tab) => (
        <button
          key={tab.screen}
          type="button"
          aria-current={tab.screen === screen ? 'page' : undefined}
          className="abas-texto__aba t-ui-13"
          onClick={() => goTo(tab.screen)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export function BottomTabs() {
  const { layout } = useWorkspace()
  const { screen: asked, goTo } = useNavigation()
  const screen = resolveScreen(layout, asked)

  return (
    <nav className="linha abas-baixo" aria-label="Áreas">
      {tabsFor(layout).map((tab) => {
        const current = tab.screen === screen
        return (
          <button
            key={tab.screen}
            type="button"
            aria-current={current ? 'page' : undefined}
            className={`abas-baixo__aba ${current ? 't-ui-12-forte' : 't-ui-12'}`}
            onClick={() => goTo(tab.screen)}
          >
            <Icon name={tab.icon} size={22} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
