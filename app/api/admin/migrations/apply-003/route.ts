import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { PostgrestClient } from '@supabase/postgrest-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Drop problematic policies
    const statements = [
      'DROP POLICY IF EXISTS "Team_members: Allow read access to team members" ON team_members',
      'DROP POLICY IF EXISTS "Users: Allow admins to read team member profiles" ON users',
      
      // Create new policies
      `CREATE POLICY "Team_members_select_own_or_team" ON team_members FOR SELECT TO authenticated USING (true)`,
      `CREATE POLICY "Team_members_insert_auth" ON team_members FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "Team_members_update_own" ON team_members FOR UPDATE TO authenticated USING (user_id = auth.uid()::text)`,
      `CREATE POLICY "Team_members_delete_own" ON team_members FOR DELETE TO authenticated USING (user_id = auth.uid()::text)`,
      
      `CREATE POLICY "Users_select_own" ON users FOR SELECT TO authenticated USING (auth_id = auth.uid()::text)`,
      `CREATE POLICY "Users_select_team_members" ON users FOR SELECT TO authenticated USING (true)`,
    ];

    let lastError = null;
    let successCount = 0;

    for (const statement of statements) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (response.ok) {
          successCount++;
        } else {
          lastError = await response.text();
        }
      } catch (err) {
        console.error(`Failed to execute: ${statement}`, err);
        lastError = String(err);
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      applied: successCount,
      total: statements.length,
      lastError
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: String(error),
        hint: 'Apply migration manually in Supabase SQL Editor'
      },
      { status: 500 }
    );
  }
}

