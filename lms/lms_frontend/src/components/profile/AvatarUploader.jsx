/**
 * AvatarUploader Component
 * 
 * Allows users to upload and preview avatar images.
 * 
 * Props:
 * - currentAvatarUrl: string (current avatar URL)
 * - onAvatarChange: function (callback with new avatar URL)
 * - size: number (avatar size in pixels, default: 150)
 */
import { useState, useRef } from 'react';

const AvatarUploader = ({ currentAvatarUrl, onAvatarChange, size = 150 }) => {
  const [preview, setPreview] = useState(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getDefaultAvatar = (name) => {
    const initial = name?.[0]?.toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=128`;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setPreview(previewUrl);
        onAvatarChange(previewUrl);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    onAvatarChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const avatarUrl = preview || currentAvatarUrl || getDefaultAvatar('');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full object-cover border-4 border-slate-200"
          style={{ width: `${size}px`, height: `${size}px` }}
          onError={(e) => {
            e.target.src = getDefaultAvatar('');
          }}
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition">
          {preview || currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        {(preview || currentAvatarUrl) && (
          <button
            onClick={handleRemoveAvatar}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
          >
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-xs">
        JPG, PNG or GIF. Max size 5MB
      </p>
    </div>
  );
};

export default AvatarUploader;

