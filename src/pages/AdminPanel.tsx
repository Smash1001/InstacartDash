import { useState } from 'react'
import { AdminNavigation, type AdminTab } from '../components/AdminNavigation'
import { AnnouncementTab } from '../components/admin/AnnouncementTab'
import { RunnersTab } from '../components/admin/RunnersTab'
import { WeeklyPerformanceTab } from '../components/admin/WeeklyPerformanceTab'

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('performance')

  return (
    <div className="min-h-full bg-slate-50">
      <AdminNavigation active={tab} onChange={setTab} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'performance' && <WeeklyPerformanceTab />}
        {tab === 'runners' && <RunnersTab />}
        {tab === 'announcement' && <AnnouncementTab />}
      </main>
    </div>
  )
}
