# 📧 Email Assets Setup Guide

## 🚀 Quick Setup (Recommended)

### 1. Add Your Assets to Public Folder

Create these files in your `public/assets/email/` folder:

```
public/
  assets/
    email/
      hero-verify.png    # Email verification hero image
      hero-welcome.png   # Welcome email hero image  
      hero-reset.png     # Password reset hero image
    icons/
      twitter.svg       # X/Twitter icon
      linkedin.svg      # LinkedIn icon
      instagram.svg     # Instagram icon
      rss.svg          # Blog/RSS icon
```

### 2. Asset Specifications

**Hero Images:**
- **Size:** 720x300px (or similar 2.4:1 ratio)
- **Format:** PNG with transparency
- **Content:** Professional graphics matching your brand

**Social Icons:**
- **Size:** 32x32px
- **Format:** SVG (scalable)
- **Style:** White icons for dark backgrounds

### 3. Deploy to Vercel

Once you add the assets and deploy:

```bash
# Your assets will be available at:
https://newrun.club/assets/email/hero-verify.png
https://newrun.club/assets/email/hero-welcome.png
https://newrun.club/assets/email/hero-reset.png
https://newrun.club/assets/icons/twitter.svg
https://newrun.club/assets/icons/linkedin.svg
https://newrun.club/assets/icons/instagram.svg
https://newrun.club/assets/icons/rss.svg
```

## 🎨 Alternative: Use Existing Assets

If you want to use assets from your frontend:

```bash
# Copy from frontend assets
cp frontend/src/assets/Images/your-hero-image.png public/assets/email/hero-verify.png
cp frontend/src/assets/icons/twitter.svg public/assets/icons/twitter.svg
```

## 🔧 Testing Your Assets

1. **Add a test image** to `public/assets/email/test.png`
2. **Visit** `https://newrun.club/assets/email/test.png` in browser
3. **If it loads** - your setup is working!

## 📱 Email Client Testing

Test your emails in:
- **Gmail** (web & mobile)
- **Outlook** (desktop & web)
- **Apple Mail** (desktop & mobile)
- **Yahoo Mail**

## 🚀 Production Deployment

After adding assets:

1. **Commit changes:**
   ```bash
   git add public/assets/
   git commit -m "Add email assets"
   git push
   ```

2. **Deploy to Vercel:**
   - Assets will be automatically available
   - No additional configuration needed

## 🎯 Pro Tips

- **Use PNG for hero images** (better email client support)
- **Use SVG for icons** (scalable and crisp)
- **Keep file sizes small** (< 100KB per image)
- **Test in multiple email clients** before going live
- **Use descriptive filenames** for easy management

## 🔍 Troubleshooting

**Images not loading?**
- Check file paths are correct
- Ensure files are in `public/assets/email/`
- Verify deployment completed successfully
- Test URLs in browser first

**Email clients blocking images?**
- This is normal - users need to "Load Images"
- Your emails will still look professional without images
- Consider adding alt text for accessibility
