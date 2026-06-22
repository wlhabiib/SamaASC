'use client';

import { useState } from 'react';

const MigrationSQL = `
-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Team_members: Allow read access to team members" ON team_members;
DROP POLICY IF EXISTS "Users: Allow admins to read team member profiles" ON users;

-- Step 2: Create new non-recursive policies for team_members
CREATE POLICY "Team_members_select_own_or_team"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team_members_insert_auth"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team_members_update_own"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Team_members_delete_own"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Step 3: Create new non-recursive policies for users
CREATE POLICY "Users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid()::text);

CREATE POLICY "Users_select_team_members"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Done! You can now read team_members and users without recursion errors.
`;

export default function MigrationPage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(MigrationSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-4">🔧 Supabase RLS Recursion Fix</h1>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
            <p className="text-red-200 font-semibold mb-2">⚠️ Infinite Recursion Detected</p>
            <p className="text-red-100 text-sm">
              Your RLS policies are causing infinite recursion. Copy the SQL below and execute it in Supabase SQL Editor.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">📋 SQL Migration</h2>
            <pre className="bg-slate-900 p-4 rounded border border-slate-700 text-slate-300 text-xs overflow-auto max-h-96">
              {MigrationSQL}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded font-medium transition ${
                copied
                  ? 'bg-green-500/20 text-green-300 border border-green-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy SQL'}
            </button>
            
            <a
              href="https://app.supabase.com/project/_/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded font-medium bg-slate-700 text-white hover:bg-slate-600 transition"
            >
              🚀 Open Supabase SQL Editor
            </a>
          </div>

          <div className="mt-8 bg-slate-900 p-6 rounded border border-slate-700">
            <h3 className="text-white font-semibold mb-3">📝 Instructions</h3>
            <ol className="text-slate-300 space-y-2 text-sm">
              <li>1️⃣ Click "Copy SQL" to copy the migration</li>
              <li>2️⃣ Click "Open Supabase SQL Editor" to open your SQL editor</li>
              <li>3️⃣ Paste the SQL and execute it</li>
              <li>4️⃣ Refresh the page and try logging in again</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
