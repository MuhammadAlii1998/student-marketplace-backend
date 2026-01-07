# Image Upload Implementation Guide

## Overview
This guide explains how the image upload feature works with Cloudinary integration for the Student Marketplace backend.

## 🚀 Quick Start

### 1. Get Cloudinary Credentials

1. Sign up at https://cloudinary.com (Free tier: 25GB storage, 25 credits/month)
2. Go to Dashboard (https://cloudinary.com/console)
3. Copy the following:
   - **Cloud Name** (e.g., `dxxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### 2. Configure Environment Variables

**For Local Development** - Update `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**For Production (Vercel):**
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add three variables:
   - `CLOUDINARY_CLOUD_NAME` = your_actual_cloud_name
   - `CLOUDINARY_API_KEY` = your_actual_api_key
   - `CLOUDINARY_API_SECRET` = your_actual_api_secret
4. Redeploy your application

### 3. Verify Installation

Packages are already installed:
```bash
✅ cloudinary
✅ multer
✅ multer-storage-cloudinary
```

## 📡 API Endpoints

### 1. Upload Image

**Endpoint:** `POST /api/products/upload-image`

**Authentication:** Required (Bearer Token)

**Rate Limit:** 20 uploads per 15 minutes per IP

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers:
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  ```
- Body:
  - Field name: `image`
  - File type: image/* (jpg, jpeg, png, webp, gif)
  - Max size: 5MB
  - Auto-resized to max 1200x1200px

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/products/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Example using JavaScript/Axios:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await axios.post(
  'http://localhost:3000/api/products/upload-image',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);

console.log(response.data.imageUrl); // Use this URL in product creation
```

**Success Response (200):**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/esilv-marketplace/products/abc123.jpg",
  "publicId": "esilv-marketplace/products/abc123",
  "format": "jpg",
  "width": 1200,
  "height": 900,
  "bytes": 245678
}
```

**Error Responses:**
```json
// 400 - No file provided
{
  "message": "No image file provided"
}

// 400 - Invalid file type
{
  "message": "Only image files are allowed!",
  "error": "UPLOAD_ERROR"
}

// 413 - File too large
{
  "message": "File too large. Maximum size is 5MB",
  "error": "LIMIT_FILE_SIZE"
}

// 429 - Rate limit exceeded
{
  "message": "Too many upload attempts, please try again later",
  "retryAfter": "15 minutes"
}

// 401 - Not authenticated
{
  "message": "Unauthorized"
}
```

### 2. Create Product

**Endpoint:** `POST /api/products`

**Authentication:** Required (Bearer Token)

**Request:**
```json
{
  "title": "Calculus Textbook - 8th Edition",
  "description": "Barely used calculus textbook. Perfect condition with all pages intact. No highlighting or notes.",
  "price": 45.99,
  "originalPrice": 89.99,
  "category": "Books",
  "condition": "like-new",
  "location": "Campus Library, Building A",
  "images": [
    "https://res.cloudinary.com/your-cloud/.../image1.jpg",
    "https://res.cloudinary.com/your-cloud/.../image2.jpg"
  ],
  "image": "https://res.cloudinary.com/your-cloud/.../image1.jpg"
}
```

**Field Validation:**
- `title` (required): 1-100 characters
- `description` (required): 1-1000 characters
- `price` (required): Number ≥ 0
- `originalPrice` (optional): Number ≥ 0
- `category` (required): One of ['Books', 'Electronics', 'Furniture', 'Clothing', 'Music', 'Sports']
- `condition` (required): One of ['new', 'like-new', 'good', 'fair']
- `location` (required): String
- `images` (required): Array of 1-6 Cloudinary URLs
- `image` (required): Primary/cover image URL

**Success Response (201):**
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Calculus Textbook - 8th Edition",
    "description": "Barely used calculus textbook...",
    "price": 45.99,
    "originalPrice": 89.99,
    "category": "Books",
    "condition": "like-new",
    "location": "Campus Library, Building A",
    "images": ["https://..."],
    "image": "https://...",
    "seller": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "avatar": "https://...",
      "rating": 4.5,
      "reviews": 12
    },
    "status": "active",
    "views": 0,
    "createdAt": "2026-01-07T10:30:00.000Z",
    "updatedAt": "2026-01-07T10:30:00.000Z"
  }
}
```

### 3. Delete Image

**Endpoint:** `DELETE /api/products/:productId/image/:publicId`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `productId`: MongoDB ObjectId of the product
- `publicId`: Cloudinary public ID (e.g., `esilv-marketplace/products/abc123`)

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/products/507f1f77bcf86cd799439011/image/esilv-marketplace%2Fproducts%2Fabc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "Image deleted successfully",
  "publicId": "esilv-marketplace/products/abc123",
  "result": "ok"
}
```

## 🔄 Frontend-Backend Flow

### Complete Upload Flow

```
1. User selects image files
   ↓
2. Frontend validates (type, size, count)
   ↓
3. Show image previews
   ↓
4. User fills product form
   ↓
5. User clicks "Submit"
   ↓
6. FOR EACH IMAGE:
   - Upload to /api/products/upload-image
   - Store returned imageUrl
   ↓
7. Create product with all imageUrls
   - POST to /api/products
   ↓
8. Success! Redirect to product page
```

### Frontend Example (React)

```javascript
import { useState } from 'react';
import axios from 'axios';

function SellItemForm() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate
    if (files.length > 6) {
      alert('Maximum 6 images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 5MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        return;
      }
    }

    setImages(files);
  };

  const uploadImages = async () => {
    setUploading(true);
    const urls = [];

    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('image', image);

        const response = await axios.post(
          'http://localhost:3000/api/products/upload-image',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        urls.push(response.data.imageUrl);
      }

      setUploadedUrls(urls);
      return urls;
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload failed');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Upload images first
    const imageUrls = await uploadImages();

    // Create product
    const productData = {
      title: e.target.title.value,
      description: e.target.description.value,
      price: parseFloat(e.target.price.value),
      originalPrice: parseFloat(e.target.originalPrice.value),
      category: e.target.category.value,
      condition: e.target.condition.value,
      location: e.target.location.value,
      images: imageUrls,
      image: imageUrls[0]
    };

    try {
      const response = await axios.post(
        'http://localhost:3000/api/products',
        productData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Product created successfully!');
      console.log(response.data.product);
      // Redirect to product page
    } catch (error) {
      console.error('Product creation error:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        required
      />
      
      {/* Show previews */}
      <div>
        {images.map((img, i) => (
          <img 
            key={i} 
            src={URL.createObjectURL(img)} 
            alt={`Preview ${i}`}
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ))}
      </div>

      <input name="title" placeholder="Title" required />
      <textarea name="description" placeholder="Description" required />
      <input name="price" type="number" step="0.01" placeholder="Price" required />
      <input name="originalPrice" type="number" step="0.01" placeholder="Original Price" />
      
      <select name="category" required>
        <option value="">Select Category</option>
        <option value="Books">Books</option>
        <option value="Electronics">Electronics</option>
        <option value="Furniture">Furniture</option>
        <option value="Clothing">Clothing</option>
        <option value="Music">Music</option>
        <option value="Sports">Sports</option>
      </select>

      <select name="condition" required>
        <option value="">Select Condition</option>
        <option value="new">New</option>
        <option value="like-new">Like New</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
      </select>

      <input name="location" placeholder="Location" required />

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Create Listing'}
      </button>
    </form>
  );
}
```

## 🔒 Security Features

### 1. Authentication
- All upload/create endpoints require valid JWT token
- Seller ID is automatically extracted from token

### 2. File Validation
- **Type:** Only image files (jpg, jpeg, png, webp, gif)
- **Size:** Maximum 5MB per file
- **Count:** 1 file per upload request, 1-6 images per product

### 3. Rate Limiting
- **Upload endpoint:** 20 uploads per 15 minutes per IP address
- Prevents abuse and excessive API usage

### 4. Image Processing
- Auto-resize to max 1200x1200px
- Auto-optimization (quality: auto:good)
- Auto-format (WebP for supported browsers)
- All images stored in `esilv-marketplace/products` folder

### 5. Input Validation
- Product data validated against schema
- Required fields enforced
- Category and condition enums enforced
- Price and image count limits enforced

### 6. Automatic Cleanup
- When product is deleted, all associated images are automatically removed from Cloudinary
- Prevents orphaned images and saves storage

## 🧪 Testing

### Test 1: Upload Single Image

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@esilv.fr","password":"test123"}' \
  | jq -r '.token')

# Upload image
curl -X POST http://localhost:3000/api/products/upload-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@./test-image.jpg"
```

Expected:
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/...",
  "publicId": "esilv-marketplace/products/..."
}
```

### Test 2: Create Product with Images

```bash
IMAGE_URL="https://res.cloudinary.com/YOUR_CLOUD/image/upload/v123.../abc.jpg"

curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Product\",
    \"description\": \"This is a test product with images\",
    \"price\": 29.99,
    \"category\": \"Books\",
    \"condition\": \"good\",
    \"location\": \"Campus\",
    \"images\": [\"$IMAGE_URL\"],
    \"image\": \"$IMAGE_URL\"
  }"
```

### Test 3: Rate Limiting

```bash
# Try uploading 21 times rapidly (should fail on 21st)
for i in {1..21}; do
  echo "Upload $i:"
  curl -X POST http://localhost:3000/api/products/upload-image \
    -H "Authorization: Bearer $TOKEN" \
    -F "image=@./test-image.jpg"
  echo ""
done
```

## 📊 Cloudinary Dashboard

After uploading images, you can view them in Cloudinary:

1. Go to https://cloudinary.com/console
2. Navigate to Media Library
3. Find folder: `esilv-marketplace/products`
4. View uploaded images with metadata

## ❓ Troubleshooting

### Error: "No image file provided"
- **Cause:** Field name is not "image" or no file attached
- **Solution:** Use `formData.append('image', file)` with field name "image"

### Error: "Only image files are allowed"
- **Cause:** File type is not image/*
- **Solution:** Validate file type on frontend: `file.type.startsWith('image/')`

### Error: "File too large. Maximum size is 5MB"
- **Cause:** File exceeds 5MB limit
- **Solution:** Compress image before upload or validate size on frontend

### Error: "Too many upload attempts"
- **Cause:** Rate limit exceeded (20 uploads per 15 minutes)
- **Solution:** Wait 15 minutes or implement upload queue on frontend

### Error: "Invalid category/condition"
- **Cause:** Category or condition value not in allowed list
- **Solution:** Use exact values from the enums (case-sensitive)

### Error: "Failed to upload image to Cloudinary"
- **Cause:** Invalid Cloudinary credentials or quota exceeded
- **Solution:** 
  1. Check environment variables are set correctly
  2. Verify credentials in Cloudinary dashboard
  3. Check if you've exceeded free tier limits (25 credits/month)

### Images not showing in Cloudinary dashboard
- **Cause:** Credentials incorrect or folder path misconfigured
- **Solution:** Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 🎯 Best Practices

### Frontend

1. **Validate before upload**
   ```javascript
   if (file.size > 5 * 1024 * 1024) {
     alert('File too large');
     return;
   }
   ```

2. **Show upload progress**
   ```javascript
   onUploadProgress: (progressEvent) => {
     const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
     setUploadProgress(percent);
   }
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     await uploadImage();
   } catch (error) {
     if (error.response?.status === 413) {
       alert('Image too large. Please choose a smaller file.');
     } else {
       alert('Upload failed. Please try again.');
     }
   }
   ```

4. **Compress images before upload** (using libraries like `browser-image-compression`)
   ```javascript
   import imageCompression from 'browser-image-compression';
   
   const options = {
     maxSizeMB: 1,
     maxWidthOrHeight: 1200
   };
   
   const compressedFile = await imageCompression(file, options);
   ```

### Backend

1. **Monitor Cloudinary usage**
   - Check dashboard regularly for storage usage
   - Set up alerts for quota limits

2. **Clean up orphaned images**
   - Implement periodic cleanup for unused images
   - Already automatic when products are deleted

3. **Log upload activities**
   - Track who uploaded what and when
   - Helps with debugging and abuse prevention

## 📝 Environment Variables Summary

```env
# Required for Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name    # From Cloudinary dashboard
CLOUDINARY_API_KEY=your_api_key          # From Cloudinary dashboard
CLOUDINARY_API_SECRET=your_api_secret    # From Cloudinary dashboard

# Other required variables
JWT_SECRET=your_jwt_secret               # For authentication
MONGO_URI=your_mongodb_uri               # For database
FRONTEND_URL=http://localhost:5173       # For CORS
```

## 🚀 Deployment Checklist

- [ ] Get Cloudinary credentials from https://cloudinary.com/console
- [ ] Add credentials to `.env` for local development
- [ ] Add credentials to Vercel environment variables
- [ ] Test upload endpoint locally
- [ ] Test product creation with images locally
- [ ] Deploy to Vercel
- [ ] Test upload endpoint in production
- [ ] Test product creation in production
- [ ] Verify images appear in Cloudinary dashboard
- [ ] Test image deletion
- [ ] Monitor Cloudinary usage

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)

---

**Need help?** Contact the development team or check the logs for detailed error messages.
