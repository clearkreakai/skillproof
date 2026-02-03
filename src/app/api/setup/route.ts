import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint creates the required database tables
// Call it once to set up the database
// In production, this should be done via migrations

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const tables = ['assessments', 'responses', 'results'];
  const results: Record<string, string> = {};

  // Check if tables exist by trying to query them
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.message.includes('not find')) {
      results[table] = 'NOT_FOUND - Run SQL migration in Supabase dashboard';
    } else if (error) {
      results[table] = `ERROR: ${error.message}`;
    } else {
      results[table] = 'OK';
    }
  }

  const allOk = Object.values(results).every(v => v === 'OK');

  return NextResponse.json({
    success: allOk,
    tables: results,
    message: allOk 
      ? 'All tables exist and are accessible!' 
      : 'Some tables are missing. Please run the SQL migration in the Supabase dashboard.',
    sqlUrl: 'https://supabase.com/dashboard/project/fdgvahmbnljpirynfhpx/sql/new',
  });
}

export async function GET() {
  return POST();
}
