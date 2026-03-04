# Fashion & Aesthetics Cron Configuration

## Schedule

**Status:** Manual updates currently (automated pipeline paused)

**When Active:** `0 3 * * *` (Daily at 3:00 AM PST)

---

## Focus Areas

**Primary Niches:**
- Celebrity Style (Bella Hadid, Alix Earle aesthetic)
- Fashion Trends & Aesthetics
- Lifestyle & Wellness Content
- TikTok/IG Creator Content
- Quiet Luxury & Clean Girl Aesthetic

**Removed from tracking:**
- ~~Weddings~~ (per user request)
- ~~Pets~~ (per user request)

---

## Job Breakdown (When Reactivated)

### 03:00: Social Media Scrape
```bash
openclaw skill genviral --platforms tiktok,instagram \
  --niches fashion,lifestyle,wellness,luxury \
  --output /data/fashion-radar/social-$(date +%Y%m%d).json
```

### 03:30: Editorial Scrape
```bash
node scripts/scrape-editorial.js \
  --sources vogue,harpers,elle \
  --output /data/fashion-radar/editorial-$(date +%Y%m%d).json
```

### 04:00: Trend Analysis
```bash
node scripts/analyze-trends.js \
  --social /data/fashion-radar/social-$(date +%Y%m%d).json \
  --editorial /data/fashion-radar/editorial-$(date +%Y%m%d).json \
  --output /data/fashion-radar/snapshot-$(date +%Y%m%d).json
```

### 04:30: Notion Sync
```bash
node scripts/sync-notion.js \
  --database 309cf0ef753881919011d4c9a12683fe \
  --output /data/fashion-radar/notion-$(date +%Y%m%d).json
```

---

## Dashboard Integration

**Live Dashboard:** `/fashion-aesthetics`

Content sections:
1. Celebrity Style Tracker (Bella Hadid, Alix Earle focus)
2. Trending Aesthetics Grid
3. Content Creator Toolkit
4. Notion Moodboard (synced)
5. Fitness & Wellness Feed
6. Weekly Content Calendar

---

## Manual Updates

Currently the dashboard uses:
- Static trend data
- Mock celebrity looks
- Placeholder Notion integration

For Notion integration, set:
```bash
NOTION_TOKEN=ntn_xxx
NOTION_DATABASE_ID=309cf0ef753881919011d4c9a12683fe
```

---

*Last updated: 2026-02-28*
