# 🚀 Deployment Checklist for Image Upload Feature

## ✅ Pre-Deployment Checklist

### 1. Get Cloudinary Credentials
- [ ] Sign up at https://cloudinary.com (Free tier: 25GB storage)
- [ ] Go to Dashboard: https://cloudinary.com/console
- [ ] Copy the following credentials:
  - [ ] Cloud Name (e.g., `dxxxxxxxxx`)
  - [ ] API Key (e.g., `123456789012345`)
  - [ ] API Secret (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### 2. Local Development Setup
- [ ] Update `.env` file with Cloudinary credentials:
  ```env
  CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
  CLOUDINARY_API_KEY=your_actual_api_key
  CLOUDINARY_API_SECRET=your_actual_api_secret
  ```
- [ ] Test locally: `npm run dev`
- [ ] Test upload endpoint with curl or Postman

### 3. Vercel Production Deployment
- [ ] Go to Vercel project dashboard
- [ ] Navigate to **Settings** → **Environment Variables**
- [ ] Add three new variables:
  - [ ] `CLOUDINARY_CLOUD_NAME` = `your_actual_cloud_name`
  - [ ] `CLOUDINARY_API_KEY` = `your_actual_api_key`
  - [ ] `CLOUDINARY_API_SECRET` = `your_actual_api_secret`
- [ ] Click **Save**
- [ ] Trigger a redeploy (or push to GitHub for auto-deploy)

### 4. Verify Production Deployment
- [ ] Check deployment logs for successful build
- [ ] Test API health endpoint: `https://your-backend.vercel.app/api/health`
- [ ] Test image upload endpoint with authentication
- [ ] Verify images appear in Cloudinary dashboard under `esilv-marketplace/products`
- [ ] Test product creation with image URLs
- [ ] Test image deletion

## 📋 Environment Variables Summary

### Required Variables (must be set in both `.env` and Vercel)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | `dxxxxxxxxx` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | `123456789012345` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | `abcdefgh...` | Cloudinary Dashboard |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` | MongoDB Atlas |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` | Generate random string |
| `EMAIL_USER` | Gmail address for emails | `your@gmail.com` | Your Gmail |
| `EMAIL_PASSWORD` | Gmail app password | `xxxx xxxx xxxx xxxx` | Google Account Settings |
| `FRONTEND_URL` | Frontend URL for CORS/emails | `https://esilv-marketplace.netlify.app` | Netlify deployment |

## 🧪 Testing Endpoints

### 1. Test Image Upload (Local)

```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@esilv.fr","password":"password123"}' \
  | jq -r '.token')

# Upload an image
curl -X POST http://localhost:3000/api/products/upload-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@./test-image.jpg"
```

Expected Response:
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/esilv-marketplace/products/abc123.jpg",
  "publicId": "esilv-marketplace/products/abc123"
}
```

### 2. Test Product Creation with Image

```bash
IMAGE_URL="https://res.cloudinary.com/your-cloud/image/upload/v1234567890/esilv-marketplace/products/abc123.jpg"

curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Product\",
    \"description\": \"Testing image upload functionality\",
    \"price\": 29.99,
    \"category\": \"Books\",
    \"condition\": \"good\",
    \"location\": \"Campus Library\",
    \"images\": [\"$IMAGE_URL\"],
    \"image\": \"$IMAGE_URL\"
  }"
```

### 3. Test Production Endpoints

Replace `http://localhost:3000` with `https://your-backend.vercel.app` in the above commands.

## 🔍 Verification Steps

### Cloudinary Dashboard
1. Go to https://cloudinary.com/console
2. Click **Media Library** in the sidebar
3. Navigate to folder: `esilv-marketplace/products`
4. Verify uploaded images appear here
5. Check image transformations are applied (max 1200x1200px)

### Vercel Logs
1. Go to Vercel project dashboard
2. Click **Deployments**
3. Click on latest deployment
4. Check **Function Logs** for any errors
5. Look for successful image upload messages

### Frontend Testing
1. Login to frontend application
2. Navigate to "Sell Item" page
3. Select image(s) to upload
4. Fill out product form
5. Submit and verify product is created
6. Check product page shows uploaded images

## ⚠️ Common Issues & Solutions

### Issue: "Cloudinary credentials not found"
**Solution:**
- Verify environment variables are set in Vercel
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Issue: "File too large" error
**Solution:**
- Images must be under 5MB
- Compress images before upload
- Use frontend validation to check size before upload

### Issue: "Only image files are allowed"
**Solution:**
- Ensure file has correct MIME type (image/*)
- Check file extension is: jpg, jpeg, png, webp, or gif

### Issue: "Too many upload attempts"
**Solution:**
- Rate limit is 20 uploads per 15 minutes per IP
- Wait 15 minutes before retrying
- Implement upload queue on frontend

### Issue: Images not appearing in Cloudinary dashboard
**Solution:**
- Check `CLOUDINARY_CLOUD_NAME` is correct
- Verify API key and secret are valid
- Check Cloudinary account is active (not suspended)

### Issue: CORS errors when uploading
**Solution:**
- Verify `FRONTEND_URL` is set correctly in Vercel
- Check frontend is sending proper Authorization header
- Ensure credentials are included in fetch/axios requests

## 📊 Monitoring

### Cloudinary Usage
- Free tier: 25GB storage, 25 credits/month
- Monitor usage at: https://cloudinary.com/console/usage
- Set up usage alerts in Cloudinary settings

### Vercel Function Invocations
- Check function usage in Vercel dashboard
- Monitor for any errors or timeouts
- Review logs regularly for issues

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Image upload endpoint returns 200 with Cloudinary URL
- ✅ Product creation with images succeeds
- ✅ Images appear in Cloudinary dashboard under correct folder
- ✅ Images are displayed correctly on frontend
- ✅ Image deletion works (optional)
- ✅ Rate limiting prevents abuse
- ✅ No errors in Vercel function logs
- ✅ Frontend can upload multiple images per product

## 📚 Additional Resources

- [IMAGE_UPLOAD_GUIDE.md](./IMAGE_UPLOAD_GUIDE.md) - Complete API documentation
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Multer Documentation](https://github.com/expressjs/multer)

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel function logs for errors
2. Verify all environment variables are set
3. Test locally first before deploying
4. Review [IMAGE_UPLOAD_GUIDE.md](./IMAGE_UPLOAD_GUIDE.md) troubleshooting section
5. Check Cloudinary dashboard for failed uploads

---

**Last Updated:** January 7, 2026  
**Version:** 1.0.0
