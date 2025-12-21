import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './providers/WalletProvider'
import { FhevmProvider } from './providers/FhevmProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <FhevmProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#003087',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#60a5fa',
                secondary: '#fff',
              },
            },
          }}
        />
      </FhevmProvider>
    </WalletProvider>
  </StrictMode>,
)
