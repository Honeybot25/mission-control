-- Database schema additions for Fashion & Aesthetics Radar
-- Run this to create tables for Notion sync, celebrity looks, content ideas, and trending sounds

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notion items synced from user's Notion database
CREATE TABLE IF NOT EXISTS notion_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  url TEXT,
  image_url TEXT,
  notes TEXT,
  properties JSONB DEFAULT '{}',
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Celebrity looks tracker (Bella Hadid, Alix Earle, etc.)
CREATE TABLE IF NOT EXISTS celebrity_looks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  celebrity VARCHAR(100) NOT NULL,
  look_title TEXT,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  event VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  key_pieces TEXT[] DEFAULT '{}',
  aesthetic_vibe VARCHAR(100),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content ideas auto-generated or manually added
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- tiktok, instagram, youtube, etc.
  content_type VARCHAR(100), -- reel, story, post, video, etc.
  trending_audio TEXT,
  hooks TEXT[] DEFAULT '{}',
  visual_style TEXT,
  platform VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, posted, archived
  scheduled_for DATE,
  posted_at TIMESTAMPTZ,
  performance_notes TEXT,
  based_on_trends TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending sounds for TikTok/Reels
CREATE TABLE IF NOT EXISTS trending_sounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(50) NOT NULL, -- tiktok, instagram
  audio_name TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT,
  preview_url TEXT,
  usage_count INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2),
  category VARCHAR(100),
  best_for TEXT[], -- outfit-transition, grwm, ootd, etc.
  added_at TIMESTAMPTZ DEFAULT NOW(),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Aesthetic categories reference
CREATE TABLE IF NOT EXISTS aesthetic_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  key_elements TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  image_url TEXT,
  trending_level INTEGER DEFAULT 50, -- 0-100 scale
  parent_category VARCHAR(100),
  related_aesthetics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly content calendar
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(100),
  title TEXT,
  description TEXT,
  suggested_hook TEXT,
  suggested_hashtags TEXT[] DEFAULT '{}',
  suggested_time TIME,
  status VARCHAR(50) DEFAULT 'suggested', -- suggested, approved, scheduled, posted
  content_idea_id UUID REFERENCES content_ideas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness and wellness trends
CREATE TABLE IF NOT EXISTS wellness_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL, -- pilates, gym, wellness, routine
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  trending_score INTEGER DEFAULT 50,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default aesthetic categories
INSERT INTO aesthetic_categories (name, slug, description, key_elements, color_palette, trending_level) VALUES
('Quiet Luxury', 'quiet-luxury', 'Old money meets modern minimalism. Quality over quantity, investment pieces, understated elegance.', 
 ARRAY['minimal branding', 'natural fabrics', 'neutral palette', 'timeless silhouettes', 'quality tailoring'],
 ARRAY['cream', 'beige', 'taupe', 'sage green', 'chocolate brown', 'ivory'], 95),
('Clean Girl', 'clean-girl', 'Effortlessly polished aesthetic. Sleek hair, minimal makeup, put-together basics.', 
 ARRAY['slicked back hair', 'gold hoops', 'minimal makeup', 'fitted basics', 'monochrome outfits'],
 ARRAY['warm beige', 'soft white', 'tan', 'gold accents'], 88),
('Coastal Cowgirl', 'coastal-cowgirl', 'Beach meets western. Cowboy boots with flowy dresses, breezy linens with denim.', 
 ARRAY['cowboy boots', 'flowy dresses', 'straw hats', 'denim', 'linen', 'concho belts'],
 ARRAY['sand', 'ocean blue', 'terracotta', 'cream', 'washed denim'], 72),
('Mob Wife', 'mob-wife', 'Dramatic, unapologetic glamour. Fur (faux), animal prints, bold jewelry, smoky eyes.', 
 ARRAY['faux fur', 'leopard print', 'gold jewelry', 'smoky eyes', 'vintage designer', 'red lipstick'],
 ARRAY['black', 'gold', 'red', 'leopard', 'cream'], 65),
('Corporate Baddie', 'corporate-baddie', 'Power dressing for the modern era. Sharp suits, elevated workwear, boardroom to bar.', 
 ARRAY['structured blazers', 'wide leg trousers', 'power suits', 'minimalist heels', 'quality bags'],
 ARRAY['navy', 'black', 'cream', 'camel', 'white'], 78),
('Vintage Revival', 'vintage-revival', '90s and 00s nostalgia. Thrifted designer, unique finds, sustainable fashion.', 
 ARRAY['vintage designer', 'thrift finds', 'unique pieces', 'retro silhouettes', 'statement accessories'],
 ARRAY['vintage wash', 'muted tones', 'retro brights', 'denim blue'], 82),
('Pilates Princess', 'pilates-princess', 'Athleisure as everyday fashion. Matching sets, cute gym wear, wellness lifestyle.', 
 ARRAY['matching sets', 'ballet flats', 'leggings', 'cropped tops', 'headbands', 'tote bags'],
 ARRAY['soft pink', 'white', 'heather grey', 'sage', 'lilac'], 90)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample celebrity looks
INSERT INTO celebrity_looks (celebrity, look_title, description, event, tags, key_pieces, aesthetic_vibe) VALUES
('Bella Hadid', 'Streetwear Queen', 'Bella elevates streetwear with vintage designer pieces and quiet luxury accessories', 'NYC Street Style', 
 ARRAY['streetwear', 'vintage', 'elevated', 'old money'], 
 ARRAY['vintage racing jacket', 'baggy jeans', 'small designer bag', 'sunglasses'], 'old-money-streetwear'),
('Bella Hadid', 'Red Carpet Old Money', 'Timeless Hollywood glamour with modern edge', 'Cannes Film Festival', 
 ARRAY['red carpet', 'glamour', 'vintage-inspired'], 
 ARRAY['vintage Schiaparelli', 'diamond choker', 'slicked back hair'], 'hollywood-glamour'),
('Alix Earle', 'GRWM Morning Routine', 'Clean girl aesthetic with relatable luxury touches', 'Instagram/TikTok Content', 
 ARRAY['grwm', 'clean girl', 'relatable luxury', 'morning routine'], 
 ARRAY['matching pajama set', 'gold jewelry', 'skincare bottles', 'coffee'], 'clean-girl-luxury'),
('Alix Earle', 'Night Out Look', 'Effortless party girl vibes that feel achievable', 'Weekend Content', 
 ARRAY['night out', 'party girl', 'elevated casual'], 
 ARRAY['mini dress', 'strappy heels', 'clutch', 'statement earrings'], 'relatable-glam')
ON CONFLICT DO NOTHING;

-- Insert sample content ideas
INSERT INTO content_ideas (title, description, category, content_type, platform, hooks, visual_style, based_on_trends) VALUES
('Quiet Luxury Haul', 'Showcasing investment pieces and where to find them', 'fashion', 'video', 'tiktok',
 ARRAY['POV: you only buy pieces that last 10+ years', 'Investment pieces that are actually worth the $$$', 'Quiet luxury doesn''t mean boring'], 
 'slow pans, natural lighting, quality close-ups', ARRAY['quiet luxury', 'old money', 'sustainable fashion']),
('Get Ready With Me: Coffee Run to Class', 'Relatable morning routine with clean girl aesthetic', 'lifestyle', 'video', 'tiktok',
 ARRAY['GRWM: 6am edition', 'Clean girl morning routine ☕✨', 'How I get ready in 20 min'], 
 'bright natural light, mirror shots, product close-ups', ARRAY['clean girl', 'grwm', 'morning routine']),
('Bella Hadid Street Style Breakdown', 'Analyzing her latest looks and how to recreate', 'fashion', 'carousel', 'instagram',
 ARRAY['Steal her style: Bella Hadid edition', 'Bella Hadid aesthetic decoded 🖤'], 
 'high quality photos, side-by-side comparisons, text overlays', ARRAY['bella hadid', 'street style', 'celebrity fashion']),
('Pilates Princess Outfit Ideas', 'Cute gym-to-brunch looks', 'fitness', 'reel', 'instagram',
 ARRAY['Gym outfits that actually motivate me', 'Pilates princess starter pack', 'From workout to brunch ✨'], 
 'bright airy gym setting, movement shots, outfit details', ARRAY['pilates princess', 'athleisure', 'fitness aesthetic'])
ON CONFLICT DO NOTHING;

-- Insert trending sounds
INSERT INTO trending_sounds (platform, audio_name, artist, category, best_for, growth_rate) VALUES
('tiktok', 'original sound - makeba', 'Makeba', 'upbeat', ARRAY['outfit transition', 'fashion haul'], 45.2),
('tiktok', 'What Was I Made For?', 'Billie Eilish', 'slow/emotional', ARRAY['grwm', 'aesthetic montage'], 38.5),
('tiktok', 'Rich Girl', 'Hall & Oates', 'classic', ARRAY['luxury lifestyle', 'old money aesthetic'], 52.1),
('instagram', 'Sexy Back', 'Justin Timberlake', 'upbeat', ARRAY['reel intro', 'fashion transition'], 41.8),
('tiktok', 'Pink + White', 'Frank Ocean', 'chill', ARRAY['clean girl aesthetic', 'morning routine'], 36.2)
ON CONFLICT DO NOTHING;

-- Log schema creation
INSERT INTO system_audit_log (action, details) 
VALUES ('fashion_aesthetics_schema_created', 
        '{"tables": ["notion_items", "celebrity_looks", "content_ideas", "trending_sounds", "aesthetic_categories", "content_calendar", "wellness_trends"]}');