/**
 * App route tree. Data loads through services/api/nextplayApi (mock until HTTP adapter exists).
 * Types: types/models.ts. Handoff notes: README and docs/TEAMMATE-START.md.
 */
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import AppProviders from '@/providers/AppProviders'
import RootLayout from '@/layouts/RootLayout'
import RequireAuthRoute from '@/router/RequireAuthRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AccountSettingsPage from '@/pages/settings/AccountSettingsPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'

import LeagueLayout from '@/layouts/LeagueLayout'
import LeagueHomePage from '@/pages/league/LeagueHomePage'
import DraftPage from '@/pages/league/DraftPage'
import TeamPage from '@/pages/league/TeamPage'
import PlayersPage from '@/pages/league/PlayersPage'
import MatchupsPage from '@/pages/league/MatchupsPage'
import StandingsPage from '@/pages/league/StandingsPage'
import ChatPage from '@/pages/league/ChatPage'
import LeagueSettingsPage from '@/pages/league/LeagueSettingsPage'
import PlayoffsPage from '@/pages/league/PlayoffsPage'

export default function App() {
  return (
    <AppProviders>
      <div className="flex min-h-svh w-full flex-1 flex-col">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<RequireAuthRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="settings/account" element={<AccountSettingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                <Route path="league/:id" element={<LeagueLayout />}>
                  <Route index element={<Navigate to="matchups" replace />} />
                  <Route path="overview" element={<LeagueHomePage />} />
                  <Route path="draft" element={<DraftPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="players" element={<PlayersPage />} />
                  <Route path="matchups" element={<MatchupsPage />} />
                  <Route path="standings" element={<StandingsPage />} />
                  <Route path="playoffs" element={<PlayoffsPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="settings" element={<LeagueSettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </AppProviders>
  )
}
