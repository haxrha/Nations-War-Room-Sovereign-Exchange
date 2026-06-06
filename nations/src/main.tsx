import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpacetimeDBProvider } from 'spacetimedb/react'
import './index.css'
import App from './App.tsx'
import { GameProvider } from './context/GameContext'
import { BotProvider } from './context/BotContext'
import { connectionBuilder } from './lib/spacetime'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <GameProvider>
        <BotProvider>
          <App />
        </BotProvider>
      </GameProvider>
    </SpacetimeDBProvider>
  </StrictMode>,
)
