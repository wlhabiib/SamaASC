import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Use raw SQL query to add columns
    const { error: error1 } = await supabase
      .rpc('exec_sql', {
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS scorers TEXT;`
      });

    const { error: error2 } = await supabase
      .rpc('exec_sql', {
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS formation TEXT DEFAULT '4-3-3';`
      });

    // Check if columns exist by querying a match
    const { data: matchData, error: queryError } = await supabase
      .from('matches')
      .select('scorers, formation')
      .limit(1);

    const hasScorers = !queryError && matchData && 'scorers' in matchData[0];
    const hasFormation = !queryError && matchData && 'formation' in matchData[0];

    return NextResponse.json({ 
      success: true, 
      message: 'Schema update attempted',
      hasScorers,
      hasFormation,
      errors: [error1?.message, error2?.message].filter(Boolean)
    });
  } catch (error) {
    console.error('Error fixing matches schema:', error);
    return NextResponse.json({ 
      error: 'Failed to fix schema',
      details: (error as Error).message
    }, { status: 500 });
  }
}
