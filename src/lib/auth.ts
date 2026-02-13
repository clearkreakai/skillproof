'use client'

import { createSupabaseBrowserClient } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

const supabase = createSupabaseBrowserClient()

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
  return data
}

/**
 * Update password (for logged-in user or from reset link)
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })
}

/**
 * Delete user account (requires server-side operation for full deletion)
 */
export async function deleteAccount() {
  // First sign out the user
  // Note: Full account deletion should be handled by a server function
  // that uses the service role key to delete from auth.users
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  
  // The actual deletion is handled by an API route
  const response = await fetch('/api/auth/delete-account', {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete account')
  }
}

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as UserProfile
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<Pick<UserProfile, 'full_name'>>) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}

// ============================================================================
// USER ASSESSMENTS
// ============================================================================

export interface UserAssessment {
  id: string
  company_name: string
  role_title: string
  status: 'draft' | 'active' | 'completed'
  created_at: string
  result_id?: string
  result_score?: number
  result_tier?: string
}

/**
 * Get all assessments for the current user
 */
export async function getUserAssessments(): Promise<UserAssessment[]> {
  const user = await getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('assessments')
    .select(`
      id,
      company_name,
      role_title,
      status,
      created_at,
      results (
        id,
        result_data
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user assessments:', error)
    return []
  }

  return (data || []).map((assessment: Record<string, unknown>) => {
    const results = assessment.results as Array<{ id: string; result_data: { overallScore: number; tier: string } }> | null
    const result = results && results.length > 0 ? results[0] : null
    return {
      id: assessment.id as string,
      company_name: assessment.company_name as string,
      role_title: assessment.role_title as string,
      status: assessment.status as 'draft' | 'active' | 'completed',
      created_at: assessment.created_at as string,
      result_id: result?.id,
      result_score: result?.result_data?.overallScore,
      result_tier: result?.result_data?.tier,
    }
  })
}
