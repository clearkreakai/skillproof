'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getUserAssessments, signOut, updatePassword, type UserAssessment } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

type Tab = 'assessments' | 'settings'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [assessments, setAssessments] = useState<UserAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('assessments')

  useEffect(() => {
    async function loadData() {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      
      const userAssessments = await getUserAssessments()
      setAssessments(userAssessments)
      setLoading(false)
    }
    loadData()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                METTLE
              </span>
              <div className="ml-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your assessments and account settings
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-8 w-fit">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'assessments'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              My Assessments
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Account Settings
            </button>
          </div>

          {/* Content */}
          {activeTab === 'assessments' && (
            <AssessmentsTab assessments={assessments} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab user={user} onSignOut={handleSignOut} />
          )}
        </div>
      </main>
    </div>
  )
}

function AssessmentsTab({ assessments }: { assessments: UserAssessment[] }) {
  if (assessments.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No assessments yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Take your first skills assessment and prove what you can do
        </p>
        <Link
          href="/assess"
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Start an Assessment
        </Link>
      </div>
    )
  }

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'exceptional': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'strong': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'qualified': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
      case 'developing': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {assessments.length} Assessment{assessments.length !== 1 ? 's' : ''}
        </h2>
        <Link
          href="/assess"
          className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assessment
        </Link>
      </div>

      {assessments.map((assessment) => (
        <div key={assessment.id} className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {assessment.role_title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {assessment.company_name}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(assessment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {assessment.result_tier && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(assessment.result_tier)}`}>
                    {assessment.result_tier}
                  </span>
                )}
                {assessment.result_score && (
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {assessment.result_score}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {assessment.status === 'completed' && assessment.result_id ? (
                <Link
                  href={`/results/${assessment.result_id}`}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  View Results
                </Link>
              ) : assessment.status === 'active' ? (
                <Link
                  href={`/assess/${assessment.id}`}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Continue
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsTab({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setPasswordStatus('loading')
    setPasswordError('')

    try {
      await updatePassword(newPassword)
      setPasswordStatus('success')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordStatus('idle'), 3000)
    } catch (err) {
      setPasswordStatus('error')
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Account deleted, sign out and redirect
      onSignOut()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Member since
            </label>
            <p className="text-gray-900 dark:text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label 
              htmlFor="newPassword" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              disabled={passwordStatus === 'loading'}
              className="input"
            />
          </div>
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={passwordStatus === 'loading'}
              className="input"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}

          {passwordStatus === 'success' && (
            <p className="text-sm text-green-600 dark:text-green-400">Password updated successfully!</p>
          )}

          <button
            type="submit"
            disabled={passwordStatus === 'loading'}
            className="btn-primary py-2 px-4 text-sm"
          >
            {passwordStatus === 'loading' ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200 dark:border-red-900/50">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Once you delete your account, there is no going back. All your assessments and results will be permanently deleted.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors border border-gray-200 dark:border-slate-700 rounded-xl"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
