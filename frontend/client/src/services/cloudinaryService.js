const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only JPEG, PNG, WebP, or GIF images are allowed.";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`;
  return null;
}

export async function uploadToCloudinary(file, onProgress = null) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "sarinya-products");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL);
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
      else reject(new Error(JSON.parse(xhr.responseText)?.error?.message || "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}
