'use client';

import { SignUp } from '@clerk/nextjs';

export default function UserRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
