'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Play } from 'lucide-react';

interface FileUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  onTypeChange?: (type: 'image' | 'video') => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  teamId?: string;
}

export default function FileUpload({
  value,
  onChange,
  onTypeChange,
  accept = 'image/*,video/*',
  maxSize,
  label = 'Image',
  teamId
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type for preview and upload metadata
    const isVideo = file.type.startsWith('video/');

    setError('');
    setUploading(true);

    setFileType(isVideo ? 'video' : 'image');
    if (onTypeChange) {
      onTypeChange(isVideo ? 'video' : 'image');
    }

    try {
      // Upload to Supabase Storage via API
      if (!teamId) {
        throw new Error('teamId is required for upload');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('team_id', teamId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const previewUrl = isVideo ? data.url : data.url;

      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onChange(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors de l\'upload: ' + (err as Error).message);
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileType('image');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      
      {preview ? (
        <div className="relative">
          <div className="w-full h-32 rounded-lg border-2 border-gray-200 overflow-hidden">
            {fileType === 'video' ? (
              <video 
                src={preview} 
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {fileType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Play size={18} className="text-green-600 ml-0.5" />
              </div>
            </div>
          )}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Upload en cours...</span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-500">Cliquez pour uploader</span>
                <span className="text-xs text-gray-400">{maxSize ? `Max ${maxSize}MB` : 'Aucune limite'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
