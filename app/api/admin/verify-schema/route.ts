import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Verify database schema
    const { data, error } = await supabase.rpc('verify_database_schema');

    if (error) {
      console.error('Schema verification error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      schema: data,
      message: 'Database schema verification complete'
    });
  } catch (error) {
    console.error('Error verifying schema:', error);
    return NextResponse.json(
      { error: 'Failed to verify schema' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Run schema verification and auto-fix
    console.log('Running database schema verification...');

    // Call the RPC function which will auto-fix missing columns
    const { data, error } = await supabase.rpc('verify_database_schema');

    if (error) {
      console.error('Schema initialization error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      schema: data,
      message: 'Database schema initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing schema:', error);
    return NextResponse.json(
      { error: 'Failed to initialize schema' },
      { status: 500 }
    );
  }
}
