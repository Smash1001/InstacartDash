import { useState } from 'react'
import { AdminNavigation, type AdminTab } from '../components/AdminNavigation'
import { AnnouncementTab } from '../components/admin/AnnouncementTab'
import { RunnersTab } from '../components/admin/RunnersTab'
import { WeeklyPerformanceTab } from '../components/admin/WeeklyPerformanceTab'
import { Button } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('performance')
  const { session } = useAuth()

  return (
    <div className="min-h-full bg-slate-50">
      <AdminNavigation
        active={tab}
        onChange={setTab}
        actions={
          <>
            <span className="hidden text-sm text-slate-500 sm:inline">{session?.user.email}</span>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'performance' && <WeeklyPerformanceTab />}
        {tab === 'runners' && <RunnersTab />}
        {tab === 'announcement' && <AnnouncementTab />}
      </main>
    </div>
  )
}
