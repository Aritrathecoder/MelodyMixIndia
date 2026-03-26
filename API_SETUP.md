# 🔑 API Setup Guide for MelodyMixx India

## Problem: "All Gemini models exhausted" Error

This error occurs because the **Gemini API key is not configured**. The app can work without it using fallbacks, but to get AI-powered recommendations, you need to add your API key.

---

## ✅ Solution 1: Add Gemini API Key (Recommended)

### Step 1: Get Your Free API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key

### Step 2: Create `.env.local` File
1. In the root of `MelodyMixx India` folder, create a file named `.env.local`
2. Add the following content:

```env
# Supabase (Optional - for user auth & library)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini AI (Required for AI recommendations)
GEMINI_API_KEY=AIzaSy...your_actual_key_here

# YouTube Music API (Optional - app works without it)
YTMUSIC_API_KEY=your_youtube_music_api_key_here
```

### Step 3: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## ✅ Solution 2: Use Without Gemini API (App Still Works!)

The app now has **smart fallbacks** that provide recommendations even without AI:

- **Fallback Queries**: Pre-curated search terms based on mood, time, genre
- **Emergency Fallbacks**: Generic trending searches when all else fails
- **Track-Based Suggestions**: Recommendations based on current artist/title

### What Works Without API Key:
✅ Browse trending music  
✅ Search functionality  
✅ Play songs from YouTube Music  
✅ Create playlists (with Supabase)  
✅ Like songs (with Supabase)  
✅ Listening history (with Supabase)  

### What Needs API Key:
❌ AI-powered smart recommendations  
❌ Intelligent queue generation  
❌ Search query enhancement  
❌ Mood-based curation  

---

## 🎯 Quick Start (No API Keys)

Just run the app as-is! It will use fallback mechanisms:

```bash
npm install
npm run dev
```

The app will automatically use fallback recommendations when Gemini is unavailable.

---

## 📊 Understanding the Logs

You'll see these messages in the terminal:

```
[Gemini] API key not configured. Using fallback.
[QuickPicks] Gemini failed Error: All Gemini models exhausted
[YTMusic-NoQuota] Searching for: "Arijit Singh Latest Chill song"
```

This is **NORMAL** and expected when no API key is present. The app gracefully degrades to manual search queries.

---

## 🔒 Security Notes

- Never commit `.env.local` to Git (it's in `.gitignore`)
- Use environment variables in production (Vercel, Netlify, etc.)
- Rotate API keys periodically

---

## 🆘 Troubleshooting

### Error persists after adding API key?
1. Check if `.env.local` is in the correct location
2. Restart the dev server
3. Verify the key is valid at https://makersuite.google.com
4. Check for typos in the key

### Getting 403 Forbidden?
- Your API key might be invalid or expired
- Regenerate a new key from Google AI Studio
- Ensure billing is enabled if required

---

## 📞 Support

For issues, check:
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
