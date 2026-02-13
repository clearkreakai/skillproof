import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // Delete user's data first (assessments, responses, results)
  // The cascade delete should handle this if foreign keys are set up properly
  // But let's be explicit

  // Delete user's results
  await supabase
    .from('results')
    .delete()
    .eq('assessment_id', supabase.from('assessments').select('id').eq('user_id', user.id))

  // Delete user's responses  
  await supabase
    .from('responses')
    .delete()
    .eq('assessment_id', supabase.from('assessments').select('id').eq('user_id', user.id))

  // Delete user's assessments
  await supabase
    .from('assessments')
    .delete()
    .eq('user_id', user.id)

  // Delete user profile
  await supabase
    .from('user_profiles')
    .delete()
    .eq('id', user.id)

  // Note: To fully delete the user from auth.users, you need to use the service role key
  // which should only be used server-side. For now, we'll just sign them out.
  // In production, you'd use a service role client to call:
  // await supabaseAdmin.auth.admin.deleteUser(user.id)

  // Sign out the user
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
