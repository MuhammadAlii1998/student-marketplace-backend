# Cloudinary Image Upload Guide

## 📸 Overview

This backend uses **Cloudinary** for image storage and management. Images are automatically optimized, resized, and stored in the cloud.

---

## 🔧 Setup

### 1. Create Cloudinary Account

1. Go to: https://cloudinary.com/
2. Sign up for a free account
3. Go to Dashboard: https://cloudinary.com/console

### 2. Get Your Credentials

From the Cloudinary Console dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

### 3. Add to Environment Variables

**Local Development (`.env`):**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   ```
   CLOUDINARY_CLOUD_NAME = your-cloud-name
   CLOUDINARY_API_KEY = your-api-key
   CLOUDINARY_API_SECRET = your-api-secret
   ```
3. Redeploy

---

## 🛣️ API Endpoints

### 1. Upload Image

**POST** `/api/products/upload-image`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
image: <file>
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v123456/student-marketplace/abc123.jpg",
  "publicId": "student-marketplace/abc123"
}
```

**Example (curl):**
```bash
curl -X POST https://student-marketplace-backend.vercel.app/api/products/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/products/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data.url); // Use this URL in product creation
```

---

### 2. Create Product with Images

**POST** `/api/products`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "MacBook Pro 2021",
  "description": "Great condition, barely used",
  "price": 1200,
  "category": "Electronics",
  "condition": "Like New",
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v123456/student-marketplace/abc123.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v123456/student-marketplace/def456.jpg"
  ]
}
```

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "MacBook Pro 2021",
  "images": [...],
  "seller": {...},
  ...
}
```

---

### 3. Delete Image from Cloudinary (Optional)

**DELETE** `/api/products/:productId/image/:publicId`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Example:**
```
DELETE /api/products/65a1b2c3d4e5f6g7h8i9j0k1/image/student-marketplace%2Fabc123
```

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

**Note:** URL encode the `publicId` (replace `/` with `%2F`)

---

## 🎨 Frontend Integration

### React/Vue Component Example

```javascript
import { useState } from 'react';

function ProductUpload() {
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      setImageUrls(prev => [...prev, data.url]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (productData) => {
    // Include uploaded image URLs
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...productData,
        images: imageUrls
      })
    });

    const product = await response.json();
    console.log('Product created:', product);
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      
      <div>
        {imageUrls.map(url => (
          <img key={url} src={url} alt="Product" style={{width: 100}} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🔒 Image Specifications

### Upload Limits:
- **Max file size:** 5 MB
- **Allowed formats:** JPG, JPEG, PNG, WebP, GIF
- **Auto optimization:** Quality and format
- **Auto resize:** Max 1000x1000 pixels (maintains aspect ratio)

### Storage:
- **Folder:** `student-marketplace/`
- **Public access:** Yes (anyone can view via URL)
- **CDN:** Global delivery via Cloudinary CDN

---

## 🎯 Best Practices

### 1. Upload Flow
```
User selects images
  ↓
Frontend: Upload one by one to /api/products/upload-image
  ↓
Backend: Stores in Cloudinary, returns URL
  ↓
Frontend: Collects all URLs
  ↓
Frontend: Submit product with image URLs to /api/products
```

### 2. Multiple Images
```javascript
const uploadMultipleImages = async (files) => {
  const uploadPromises = Array.from(files).map(file => 
    uploadSingleImage(file)
  );
  const results = await Promise.all(uploadPromises);
  return results.map(r => r.url);
};
```

### 3. Error Handling
```javascript
try {
  const response = await fetch('/api/products/upload-image', {...});
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
} catch (error) {
  console.error('Upload failed:', error.message);
  // Show user-friendly error message
}
```

### 4. Progress Indication
```javascript
const [uploadProgress, setUploadProgress] = useState(0);

const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    setUploadProgress((e.loaded / e.total) * 100);
  }
});
```

---

## 🐛 Troubleshooting

### Issue: "No image file provided"
**Solution:** Make sure you're sending `multipart/form-data` with field name `image`

### Issue: "Only image files are allowed"
**Solution:** Check file MIME type. Must be `image/*`

### Issue: "File too large"
**Solution:** Compress image or reduce size to under 5MB

### Issue: 401 Unauthorized
**Solution:** Include valid JWT token in Authorization header

### Issue: Cloudinary credentials error
**Solution:** Verify environment variables are set correctly in `.env` and Vercel

---

## 📊 Cloudinary Dashboard

Monitor your images at: https://cloudinary.com/console/media_library

- View all uploaded images
- See storage usage
- Delete old images
- Monitor bandwidth

---

## 🔐 Security Notes

1. **Authentication required:** All upload endpoints require valid JWT token
2. **File type validation:** Only images allowed
3. **Size limits:** 5MB max per file
4. **Rate limiting:** API rate limits apply
5. **Public URLs:** Uploaded images are publicly accessible (suitable for marketplace)

---

## 🚀 Quick Start Checklist

- [ ] Sign up for Cloudinary account
- [ ] Copy credentials from dashboard
- [ ] Add to `.env` file locally
- [ ] Add to Vercel environment variables
- [ ] Test upload endpoint with Postman
- [ ] Integrate into frontend
- [ ] Test product creation with images

---

**Need help?** Check Cloudinary docs: https://cloudinary.com/documentation
