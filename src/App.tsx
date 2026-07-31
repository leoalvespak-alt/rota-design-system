import { AppShell } from './app/AppShell'
import { ExportNodeProvider } from './lib/export/ExportNodeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'

function App() {
  return (
    <TooltipProvider>
      <ExportNodeProvider>
        <AppShell />
      </ExportNodeProvider>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  )
}

export default App
