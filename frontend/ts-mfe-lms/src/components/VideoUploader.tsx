import React, { useState, useRef } from 'react';

interface VideoUploaderProps {
  onUpload: (videoData: { url: string; size: number; duration: number }) => void;
  onCancel: () => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));

    if (videoFile) {
      handleFileSelect(videoFile);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (2GB max)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 2GB');
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only MP4, WebM, and OGG video formats are supported');
      return;
    }

    setUploadedFile(file);
  };

  const simulateUpload = () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate successful upload
          setTimeout(() => {
            onUpload({
              url: `https://videos.talentsphere.com/${uploadedFile.name}`,
              size: uploadedFile.size,
              duration: Math.floor(Math.random() * 3600) + 300 // Random duration between 5-60 minutes
            });
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Upload Video
          </h2>
          <button
            onClick={onCancel}
            disabled={isUploading}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {!uploadedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px solid #4f46e5' : '2px dashed #d1d5db',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? '#f0f9ff' : '#f8fafc',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                style={{ display: 'none' }}
              />

              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {isDragging ? 'Drop your video here' : 'Choose a video file'}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Drag and drop or click to browse
              </p>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <div>Supported formats: MP4, WebM, OGG</div>
                <div>Maximum file size: 2GB</div>
              </div>
            </div>
          ) : (
            <div>
              {/* File Info */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>📹</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {uploadedFile.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatFileSize(uploadedFile.size)}
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={() => setUploadedFile(null)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Uploading...</span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#4f46e5',
                      transition: 'width 0.2s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Upload Tips */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
                  📌 Upload Tips
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f', fontSize: '0.875rem' }}>
                  <li>Use a stable internet connection for large files</li>
                  <li>Ensure your video is in high quality (720p or higher)</li>
                  <li>Keep videos under 2 hours for better engagement</li>
                  <li>Use proper lighting and clear audio</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onCancel}
            disabled={isUploading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            Cancel
          </button>

          {uploadedFile && !isUploading && (
            <button
              onClick={simulateUpload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upload Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
