import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { createDemoGateway, sceneFromUrl } from './infrastructure/demo/demo-gateway.ts'
import { App } from './presentation/App.tsx'
import { navigationFromUrl } from './presentation/hooks/useNavigation.ts'
import './presentation/styles/tokens.css'
import './presentation/styles/base.css'
import './presentation/ui/ui.css'
import './presentation/shell/shell.css'
import './presentation/chat/chat.css'
import './presentation/teia/teia.css'
import './presentation/fila/fila.css'
import './presentation/settings/settings.css'
import './presentation/setup/setup.css'

const gateway = createDemoGateway(sceneFromUrl(window.location.search))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App gateway={gateway} start={navigationFromUrl(window.location.search)} />
  </StrictMode>,
)
