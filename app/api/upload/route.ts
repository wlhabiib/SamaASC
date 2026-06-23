import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'gallery';
const TEAM_BUCKET_NAME = 'team-assets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('team_id') as string;
    const type = formData.get('type') as string || 'gallery'; // 'gallery' or 'team'

    if (!file || !teamId) {
      return NextResponse.json({ error: 'Missing file or team_id' }, { status: 400 });
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Determine bucket based on type
    const bucketName = type === 'team' ? TEAM_BUCKET_NAME : BUCKET_NAME;

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${teamId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase storage error:', error);
      // Try to create bucket if it doesn't exist
      if (error.message.includes('Bucket not found')) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
          return NextResponse.json({ error: 'Failed to create storage bucket: ' + createError.message }, { status: 500 });
        }

        // Retry upload after creating bucket
        const { data: retryData, error: retryError } = await supabase
          .storage
          .from(bucketName)
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type
          });

        if (retryError) {
          return NextResponse.json({ error: 'Failed to upload file: ' + retryError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(retryData.path);
        return NextResponse.json({ url: publicUrl, path: retryData.path });
      }

      return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
