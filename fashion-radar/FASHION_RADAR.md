# Fashion & Aesthetics Radar

## Overview

The Fashion & Aesthetics Radar is a Mission Control feature that tracks celebrity style, TikTok/Instagram aesthetics, and content creator trends. It provides actionable insights for personal style, social media content, and fashion inspiration.

**Location:** `/fashion-aesthetics`  
**Status:** Live

---

## Features

### 1. Celebrity Style Tracker

Track and analyze celebrity looks for style inspiration.

**Featured Celebrities:**
- **Bella Hadid** - Old money meets streetwear aesthetic
- **Alix Earle** - GRWM and relatable luxury content
- **Kendall Jenner** - Minimalist model-off-duty looks
- **Hailey Bieber** - Clean girl aesthetic pioneer
- **Zendaya** - Red carpet and editorial style

**Data Points per Look:**
| Field | Description |
|-------|-------------|
| Celebrity | Name |
| Look Title | Brief description |
| Occasion | Street style, red carpet, casual, workout |
| Key Pieces | Breakdown of items worn |
| Color Palette | Dominant colors |
| Aesthetic Tags | Style categories |
| Inspo For | Content ideas based on this look |

### 2. Trending Aesthetics Grid

Visual tracker of rising aesthetics with popularity indicators.

**Tracked Aesthetics:**
- Quiet Luxury
- Clean Girl
- Coastal Cowgirl
- Mob Wife
- Corporate Baddie
- Vintage Revival
- Pilates Princess
- Old Money
- Streetwear Chic

**Status Indicators:**
- **Hot** 🔥 - Peak trending, high engagement
- **Rising** 📈 - Gaining momentum
- **Stable** 📊 - Mainstream staple

### 3. Content Creator Toolkit

Resources for creating TikTok and Instagram content.

**Features:**
- **Viral Hooks Library** - Copy-paste caption starters
- **Posing Guide** - IG/TikTok poses that perform
- **Trending Sounds** - Audio trends with growth rates
- **Content Ideas** - AI-generated suggestions for fashion/lifestyle
- **Hashtag Sets** - Optimized tag groups by aesthetic

### 4. Notion Moodboard Integration

Bidirectional sync with your personal Notion fashion database.

**Capabilities:**
- Pull saved items from Notion
- Add new discoveries directly to Notion
- Category organization
- Tag filtering
- Image previews

**Notion Database:** https://www.notion.so/309cf0ef753881919011d4c9a12683fe?v=309cf0ef75388170971d000ccd891ee3

### 5. Fitness & Wellness Feed

Active lifestyle inspiration and workout aesthetics.

**Content Types:**
- Pilates princess aesthetic
- Clean girl gym looks
- Morning/night routine ideas
- Gym-to-street style
- Wellness tips and trends

### 6. Weekly Content Calendar

Day-by-day suggestions for fashion/lifestyle content.

**Features:**
- Platform recommendations (IG vs TikTok)
- Optimal posting times
- Suggested hooks & hashtags
- Aesthetic themes by day

---

## Design System

- **Colors:** Muted luxury tones (beige, cream, soft brown, sage green)
- **Accents:** Amber/cyan (Mission Control brand)
- **Typography:** Clean sans-serif with elegant headers
- **Cards:** Glass-morphism with subtle borders

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/celebrity-looks` | Fetch celebrity style data |
| `/api/trending-aesthetics` | Get trending aesthetics |
| `/api/content-suggestions` | Content ideas for creators |
| `/api/notion/sync` | Pull from Notion database |
| `/api/notion/save` | Save items to Notion |
| `/api/content-calendar` | Weekly calendar data |
| `/api/wellness-trends` | Fitness & wellness trends |

---

## Quick Links

- **Live Dashboard:** https://mission-control-lovat-rho.vercel.app/fashion-aesthetics
- **Notion Database:** https://www.notion.so/309cf0ef753881919011d4c9a12683fe
- **Component Source:** `src/app/fashion-aesthetics/`

---

*Focus: Bella Hadid • Alix Earle • Fashion Inspiration • Content Creation*
