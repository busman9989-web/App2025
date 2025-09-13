-- Drop existing tables to ensure a clean state
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_votes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    two_fa_secret TEXT,
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    display_name_encrypted TEXT, -- This is crucial
    status_encrypted TEXT        -- This is crucial
);

-- Posts Table (for forum/community features)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Votes Table
CREATE TABLE post_votes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    vote_type INT NOT NULL, -- 1 for upvote, -1 for downvote
    PRIMARY KEY (user_id, post_id)
);

-- Appointments Table (for planner)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    appointment_datetime TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table (for posts)
CREATE TABLE comments ( -- Removed IF NOT EXISTS to simplify, assuming drops run first
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed to UUID
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE, -- Changed to UUID
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Changed to UUID
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create an index for faster lookups on post_id
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Journal Entries Table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    entry_date DATE NOT NULL,
    mood_rating INT CHECK (mood_rating >= 1 AND mood_rating <= 5),
    entry_text_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date) -- Ensures only one entry per user per day
);

-- Resources Table (simplified for now)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    external_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists Table
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb, -- Array of objects: [{ text: "Task 1", completed: false }]
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table (for reporting inappropriate content/users)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- e.g., 'post', 'comment', 'user'
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'reviewed', 'actioned'
    created_at TIMESTAMPTZ DEFAULT NOW()
);