import { useRef, useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { validateImageFile, uploadToCloudinary } from "../services/cloudinaryService";

export default function ImageUploadField({ currentUrl, onUrlChange }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const inputRef = useRef(null);

  // Sync preview when currentUrl changes (e.g. modal re-opens)
  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleFile = async (file) => {
    setError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Instant local preview
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const newBlobUrl = URL.createObjectURL(file);
    setBlobUrl(newBlobUrl);
    setPreview(newBlobUrl);

    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, setProgress);
      // Replace blob preview with CDN URL
      URL.revokeObjectURL(newBlobUrl);
      setBlobUrl(null);
      setPreview(url);
      onUrlChange(url);
    } catch (err) {
      // Revert preview on failure
      URL.revokeObjectURL(newBlobUrl);
      setBlobUrl(null);
      setPreview(currentUrl || null);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setPreview(null);
    setError(null);
    onUrlChange(null);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Product Image (optional)</p>

      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Product preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-3/4 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-xs font-medium">{progress}%</span>
            </div>
          )}
          {!uploading && (
            <>
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs transition-colors"
              >
                Replace image
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full h-36 border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50"
        >
          {uploading ? (
            <>
              <div className="w-1/2 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{progress}%</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">Click or drag image here</span>
              <span className="text-xs text-gray-400">JPEG, PNG, WebP, GIF · max 5 MB</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
