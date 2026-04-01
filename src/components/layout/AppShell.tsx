import { useCallback, useEffect, useMemo, useState } from 'react'
import { Home, Car, Download, Settings } from 'lucide-react'
import { useKmStore } from '../../store/kmStore'
import { today } from '../../lib/dateUtils'
import type { TabId } from '../../types'
import { Dock } from './Dock'
import { HomeView } from '../home/HomeView'
import { CarDashboard } from '../car/CarDashboard'
import { ExportModal } from '../export/ExportModal'
import { SettingsView } from '../settings/SettingsView'
import { useAutoBackup } from '../../hooks/useAutoBackup'
import { ToastContainer } from '../ui/Toast'

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('home')

  const onTabChange = useCallback((t: TabId) => setActiveTab(t), [])
  const dockItems = useMemo(() => [
    { id: 'home' as TabId, icon: Home, label: 'Overzicht', onClick: () => onTabChange('home') },
    { id: 'car' as TabId, icon: Car, label: 'Mijn Auto', onClick: () => onTabChange('car') },
    { id: 'export' as TabId, icon: Download, label: 'Exporteer', onClick: () => onTabChange('export') },
    { id: 'settings' as TabId, icon: Settings, label: 'Instellingen', onClick: () => onTabChange('settings') },
  ], [onTabChange])
  const selectedDate = useKmStore((s) => s.selectedDate)
  const setSelectedDate = useKmStore((s) => s.setSelectedDate)

  // Default to today on first load
  useEffect(() => {
    if (!selectedDate) setSelectedDate(today())
  }, [selectedDate, setSelectedDate])

  // Auto-backup to Google Drive
  useAutoBackup()

  return (
    <div className="flex flex-col h-dvh bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Content */}
      <main className="flex-1 overflow-hidden pb-24">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'car' && <CarDashboard />}
        {activeTab === 'export' && (
          <div className="h-full overflow-y-auto">
            <ExportModal />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto">
            <SettingsView />
          </div>
        )}
      </main>

      <Dock items={dockItems} activeTab={activeTab} />
      <ToastContainer />
    </div>
  )
}
