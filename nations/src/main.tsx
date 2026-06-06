import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpacetimeDBProvider } from 'spacetimedb/react'
import './index.css'
import App from './App.tsx'
import { GameProvider } from './context/GameContext'
import { connectionBuilder } from './lib/spacetime'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <GameProvider>
        <App />
      </GameProvider>
    </SpacetimeDBProvider>
  </StrictMode>,
)
