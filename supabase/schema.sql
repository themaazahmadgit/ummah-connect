-- profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  username text unique not null,
  bio text,
  role text,
  location text,
  phone text,
  website text,
  github_username text,
  orcid_id text,
  expertise text[] default '{}',
  skills text[] default '{}',
  is_admin boolean default false,
  is_verified boolean default false,
  github_verified boolean default false,
  orcid_verified boolean default false,
  created_at timestamptz default now()
);

-- posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  category text not null,
  tags text[] default '{}',
  pinned boolean default false,
  created_at timestamptz default now()
);

-- post_likes
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ideas
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  status text default 'open' check (status in ('open', 'in-progress', 'seeking-contributors', 'completed')),
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- idea_upvotes
create table if not exists idea_upvotes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique(idea_id, user_id)
);

-- idea_contributors
create table if not exists idea_contributors (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique(idea_id, user_id)
);

-- startups
create table if not exists startups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  tagline text not null,
  description text not null,
  category text not null,
  goal numeric not null,
  raised numeric default 0,
  stage text default 'Pre-seed',
  perks text[] default '{}',
  verified boolean default false,
  created_at timestamptz default now()
);

-- startup_backers
create table if not exists startup_backers (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric default 0,
  unique(startup_id, user_id)
);

-- startup_updates
create table if not exists startup_updates (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- follows
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- broadcasts
create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'announcement',
  recipient_count integer default 0,
  created_at timestamptz default now()
);

-- ============ ROW LEVEL SECURITY ============

alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table ideas enable row level security;
alter table idea_upvotes enable row level security;
alter table idea_contributors enable row level security;
alter table startups enable row level security;
alter table startup_backers enable row level security;
alter table startup_updates enable row level security;
alter table follows enable row level security;
alter table broadcasts enable row level security;

-- profiles
create policy "profiles_read_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- posts
create policy "posts_read_all" on posts for select using (true);
create policy "posts_insert_auth" on posts for insert with check (auth.uid() is not null);
create policy "posts_delete_own" on posts for delete using (auth.uid() = user_id);

-- post_likes
create policy "post_likes_read_all" on post_likes for select using (true);
create policy "post_likes_insert_own" on post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete_own" on post_likes for delete using (auth.uid() = user_id);

-- ideas
create policy "ideas_read_all" on ideas for select using (true);
create policy "ideas_insert_auth" on ideas for insert with check (auth.uid() is not null);

-- idea_upvotes
create policy "idea_upvotes_read_all" on idea_upvotes for select using (true);
create policy "idea_upvotes_insert_own" on idea_upvotes for insert with check (auth.uid() = user_id);
create policy "idea_upvotes_delete_own" on idea_upvotes for delete using (auth.uid() = user_id);

-- idea_contributors
create policy "idea_contributors_read_all" on idea_contributors for select using (true);
create policy "idea_contributors_insert_own" on idea_contributors for insert with check (auth.uid() = user_id);
create policy "idea_contributors_delete_own" on idea_contributors for delete using (auth.uid() = user_id);

-- startups
create policy "startups_read_all" on startups for select using (true);
create policy "startups_insert_auth" on startups for insert with check (auth.uid() is not null);

-- startup_backers
create policy "startup_backers_read_all" on startup_backers for select using (true);
create policy "startup_backers_insert_own" on startup_backers for insert with check (auth.uid() = user_id);
create policy "startup_backers_delete_own" on startup_backers for delete using (auth.uid() = user_id);

-- startup_updates
create policy "startup_updates_read_all" on startup_updates for select using (true);
create policy "startup_updates_insert_auth" on startup_updates for insert with check (auth.uid() is not null);

-- follows
create policy "follows_read_all" on follows for select using (true);
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);

-- broadcasts
create policy "broadcasts_read_all" on broadcasts for select using (true);
create policy "broadcasts_insert_admin" on broadcasts for insert with check (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ============ FEATURE ADDITIONS ============

-- post_replies
create table if not exists post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- bookmarks
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade,
  idea_id uuid references ideas(id) on delete cascade,
  startup_id uuid references startups(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id),
  unique(user_id, idea_id),
  unique(user_id, startup_id)
);

alter table post_replies enable row level security;
alter table bookmarks enable row level security;

create policy "replies_read_all" on post_replies for select using (true);
create policy "replies_insert_auth" on post_replies for insert with check (auth.uid() is not null);
create policy "replies_delete_own" on post_replies for delete using (auth.uid() = user_id);

create policy "bookmarks_read_own" on bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on bookmarks for delete using (auth.uid() = user_id);

-- notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null, -- 'like', 'reply', 'follow', 'admin_message'
  actor_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  idea_id uuid references ideas(id) on delete cascade,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- admin_messages
create table if not exists admin_messages (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) on delete cascade not null,
  recipient_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  body text not null,
  visibility text default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz default now()
);

alter table notifications enable row level security;
alter table admin_messages enable row level security;

create policy "notifs_read_own" on notifications for select using (auth.uid() = user_id);
create policy "notifs_insert_system" on notifications for insert with check (true);
create policy "notifs_update_own" on notifications for update using (auth.uid() = user_id);

create policy "admin_msgs_read" on admin_messages for select using (
  auth.uid() = recipient_id or
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_msgs_insert" on admin_messages for insert with check (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- research_papers
create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  doi text unique not null,
  title text not null,
  authors text[] not null default '{}',
  journal text,
  year integer,
  abstract text,
  url text,
  category text not null default 'science',
  relevance_note text,
  upvote_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists paper_upvotes (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references research_papers(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique(paper_id, user_id)
);

alter table research_papers enable row level security;
alter table paper_upvotes enable row level security;

create policy "papers_read_all" on research_papers for select using (true);
create policy "papers_insert_auth" on research_papers for insert with check (auth.uid() is not null);
create policy "papers_delete_own" on research_papers for delete using (auth.uid() = user_id);

create policy "paper_upvotes_read_all" on paper_upvotes for select using (true);
create policy "paper_upvotes_insert_own" on paper_upvotes for insert with check (auth.uid() = user_id);
create policy "paper_upvotes_delete_own" on paper_upvotes for delete using (auth.uid() = user_id);

-- events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null default 'islam',
  type text default 'online' check (type in ('online', 'in-person', 'hybrid')),
  location text,
  url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique(event_id, user_id)
);

-- jobs
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  description text not null,
  category text not null default 'tech',
  type text default 'full-time' check (type in ('full-time', 'part-time', 'contract', 'volunteer')),
  location_type text default 'remote' check (location_type in ('remote', 'onsite', 'hybrid')),
  location text,
  salary text,
  apply_url text,
  apply_email text,
  active boolean default true,
  created_at timestamptz default now()
);

-- skill_endorsements
create table if not exists skill_endorsements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  endorser_id uuid references profiles(id) on delete cascade not null,
  skill text not null,
  created_at timestamptz default now(),
  unique(profile_id, endorser_id, skill)
);

alter table events enable row level security;
alter table event_rsvps enable row level security;
alter table jobs enable row level security;
alter table skill_endorsements enable row level security;

create policy "events_read_all" on events for select using (true);
create policy "events_insert_auth" on events for insert with check (auth.uid() is not null);
create policy "events_delete_own" on events for delete using (auth.uid() = user_id);

create policy "rsvps_read_all" on event_rsvps for select using (true);
create policy "rsvps_insert_own" on event_rsvps for insert with check (auth.uid() = user_id);
create policy "rsvps_delete_own" on event_rsvps for delete using (auth.uid() = user_id);

create policy "jobs_read_all" on jobs for select using (true);
create policy "jobs_insert_auth" on jobs for insert with check (auth.uid() is not null);
create policy "jobs_delete_own" on jobs for delete using (auth.uid() = user_id);

create policy "endorsements_read_all" on skill_endorsements for select using (true);
create policy "endorsements_insert_own" on skill_endorsements for insert with check (auth.uid() = endorser_id);
create policy "endorsements_delete_own" on skill_endorsements for delete using (auth.uid() = endorser_id);
