-- ═══════════════════════════════════════════════════════════
-- IMS — COMPLETE SETUP + SEED
-- Run this in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════

-- ── PART 1: Create all missing tables ────────────────────

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

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  category text not null default 'islam',
  type text default 'public' check (type in ('public', 'private')),
  member_count integer default 1,
  created_at timestamptz default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  tag text,
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

create table if not exists group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists startup_comments (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists post_polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null unique,
  options text[] not null,
  created_at timestamptz default now()
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references post_polls(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  option_index integer not null,
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);

create table if not exists mentorship (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null unique,
  type text not null check (type in ('mentor', 'mentee', 'both')),
  skills text[] not null default '{}',
  bio text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now()
);

create table if not exists skill_endorsements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  endorser_id uuid references profiles(id) on delete cascade not null,
  skill text not null,
  created_at timestamptz default now(),
  unique(profile_id, endorser_id, skill)
);

-- ── Enable RLS on new tables ──────────────────────────────
alter table events          enable row level security;
alter table event_rsvps     enable row level security;
alter table jobs             enable row level security;
alter table groups           enable row level security;
alter table group_members    enable row level security;
alter table group_posts      enable row level security;
alter table idea_comments    enable row level security;
alter table startup_comments enable row level security;
alter table post_polls       enable row level security;
alter table poll_votes       enable row level security;
alter table mentorship       enable row level security;
alter table reports          enable row level security;
alter table skill_endorsements enable row level security;

-- ── RLS Policies (IF NOT EXISTS workaround: drop and recreate) ──
do $$ begin
  -- events
  if not exists (select 1 from pg_policies where tablename='events' and policyname='events_read_all') then
    execute 'create policy "events_read_all" on events for select using (true)';
    execute 'create policy "events_insert_auth" on events for insert with check (auth.uid() is not null)';
    execute 'create policy "events_delete_own" on events for delete using (auth.uid() = user_id)';
  end if;
  -- event_rsvps
  if not exists (select 1 from pg_policies where tablename='event_rsvps' and policyname='rsvps_read_all') then
    execute 'create policy "rsvps_read_all" on event_rsvps for select using (true)';
    execute 'create policy "rsvps_insert_own" on event_rsvps for insert with check (auth.uid() = user_id)';
    execute 'create policy "rsvps_delete_own" on event_rsvps for delete using (auth.uid() = user_id)';
  end if;
  -- jobs
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_read_all') then
    execute 'create policy "jobs_read_all" on jobs for select using (true)';
    execute 'create policy "jobs_insert_auth" on jobs for insert with check (auth.uid() is not null)';
    execute 'create policy "jobs_delete_own" on jobs for delete using (auth.uid() = user_id)';
  end if;
  -- groups
  if not exists (select 1 from pg_policies where tablename='groups' and policyname='groups_read_public') then
    execute 'create policy "groups_read_public" on groups for select using (type = ''public'' or exists (select 1 from group_members where group_id = id and user_id = auth.uid()))';
    execute 'create policy "groups_insert_auth" on groups for insert with check (auth.uid() is not null)';
    execute 'create policy "groups_delete_own" on groups for delete using (auth.uid() = user_id)';
  end if;
  -- group_members
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_read_all') then
    execute 'create policy "group_members_read_all" on group_members for select using (true)';
    execute 'create policy "group_members_insert_own" on group_members for insert with check (auth.uid() = user_id)';
    execute 'create policy "group_members_delete_own" on group_members for delete using (auth.uid() = user_id)';
  end if;
  -- group_posts
  if not exists (select 1 from pg_policies where tablename='group_posts' and policyname='group_posts_read') then
    execute 'create policy "group_posts_read" on group_posts for select using (exists (select 1 from groups where id = group_id and (type = ''public'' or exists (select 1 from group_members where group_id = group_posts.group_id and user_id = auth.uid()))))';
    execute 'create policy "group_posts_insert" on group_posts for insert with check (auth.uid() is not null and exists (select 1 from group_members where group_id = group_posts.group_id and user_id = auth.uid()))';
    execute 'create policy "group_posts_delete_own" on group_posts for delete using (auth.uid() = user_id)';
  end if;
  -- comments
  if not exists (select 1 from pg_policies where tablename='idea_comments' and policyname='idea_comments_read_all') then
    execute 'create policy "idea_comments_read_all" on idea_comments for select using (true)';
    execute 'create policy "idea_comments_insert_auth" on idea_comments for insert with check (auth.uid() is not null)';
    execute 'create policy "idea_comments_delete_own" on idea_comments for delete using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where tablename='startup_comments' and policyname='startup_comments_read_all') then
    execute 'create policy "startup_comments_read_all" on startup_comments for select using (true)';
    execute 'create policy "startup_comments_insert_auth" on startup_comments for insert with check (auth.uid() is not null)';
    execute 'create policy "startup_comments_delete_own" on startup_comments for delete using (auth.uid() = user_id)';
  end if;
  -- polls
  if not exists (select 1 from pg_policies where tablename='post_polls' and policyname='polls_read_all') then
    execute 'create policy "polls_read_all" on post_polls for select using (true)';
    execute 'create policy "polls_insert_auth" on post_polls for insert with check (auth.uid() is not null)';
  end if;
  if not exists (select 1 from pg_policies where tablename='poll_votes' and policyname='poll_votes_read_all') then
    execute 'create policy "poll_votes_read_all" on poll_votes for select using (true)';
    execute 'create policy "poll_votes_insert_own" on poll_votes for insert with check (auth.uid() = user_id)';
    execute 'create policy "poll_votes_delete_own" on poll_votes for delete using (auth.uid() = user_id)';
  end if;
  -- mentorship
  if not exists (select 1 from pg_policies where tablename='mentorship' and policyname='mentorship_read_all') then
    execute 'create policy "mentorship_read_all" on mentorship for select using (true)';
    execute 'create policy "mentorship_insert_own" on mentorship for insert with check (auth.uid() = user_id)';
    execute 'create policy "mentorship_update_own" on mentorship for update using (auth.uid() = user_id)';
    execute 'create policy "mentorship_delete_own" on mentorship for delete using (auth.uid() = user_id)';
  end if;
  -- reports
  if not exists (select 1 from pg_policies where tablename='reports' and policyname='reports_insert_own') then
    execute 'create policy "reports_insert_own" on reports for insert with check (auth.uid() = reporter_id)';
    execute 'create policy "reports_read_admin" on reports for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))';
    execute 'create policy "reports_update_admin" on reports for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))';
  end if;
  -- endorsements
  if not exists (select 1 from pg_policies where tablename='skill_endorsements' and policyname='endorsements_read_all') then
    execute 'create policy "endorsements_read_all" on skill_endorsements for select using (true)';
    execute 'create policy "endorsements_insert_own" on skill_endorsements for insert with check (auth.uid() = endorser_id)';
    execute 'create policy "endorsements_delete_own" on skill_endorsements for delete using (auth.uid() = endorser_id)';
  end if;
end $$;

-- ── Storage: avatars bucket ───────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;

-- Storage policies (safe to re-run)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_public_read') then
    execute 'create policy "avatars_public_read" on storage.objects for select using (bucket_id = ''avatars'')';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_upload_auth') then
    execute 'create policy "avatars_upload_auth" on storage.objects for insert with check (bucket_id = ''avatars'' and auth.uid() is not null)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'avatars_update_auth') then
    execute 'create policy "avatars_update_auth" on storage.objects for update using (bucket_id = ''avatars'' and auth.uid() is not null)';
  end if;
end $$;

-- ── Add missing columns ───────────────────────────────────
alter table profiles add column if not exists admin_verified boolean default false;
alter table profiles add column if not exists can_create_groups boolean default false;
alter table profiles add column if not exists sex text check (sex in ('male', 'female', 'intersex'));
alter table profiles add column if not exists scholar_url text;
alter table profiles add column if not exists researchgate_url text;
alter table profiles add column if not exists avatar_url text;
alter table posts    add column if not exists scheduled_at timestamptz;
alter table posts    add column if not exists pinned boolean default false;

-- ═══════════════════════════════════════════════════════════
-- PART 2: SEED DATA
-- ═══════════════════════════════════════════════════════════

-- Make YOU admin
insert into profiles (id, name, username, bio, role, location, expertise, is_admin, is_verified, admin_verified)
values (
  '24a14e8e-feed-49e8-9dad-e9eb574770c9',
  'Maaz', 'maaz',
  'Founder of IMS — Islamic Messaging System. Building the Muslim professional network.',
  'Founder & CEO', 'London, UK',
  array['Product','Tech','Islam'],
  true, true, true
)
on conflict (id) do update
  set is_admin = true, is_verified = true, admin_verified = true;

-- Create dummy auth users (needed for FK constraint)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('aaaaaaaa-0001-0001-0001-000000000001','aisha_r@dummy.ims',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0002-0002-0002-000000000002','omarfarouq@dummy.ims','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0003-0003-0003-000000000003','fatima_az@dummy.ims', '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0004-0004-0004-000000000004','yusuf_ok@dummy.ims',  '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0005-0005-0005-000000000005','maryam_h@dummy.ims',  '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0006-0006-0006-000000000006','ibrahim_s@dummy.ims', '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0007-0007-0007-000000000007','zainab_m@dummy.ims',  '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0008-0008-0008-000000000008','hassan_aa@dummy.ims', '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0009-0009-0009-000000000009','khadijah_n@dummy.ims','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated'),
  ('aaaaaaaa-0010-0010-0010-000000000010','bilal_c@dummy.ims',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated')
on conflict (id) do nothing;

-- Dummy profiles
insert into profiles (id, name, username, bio, role, location, expertise, is_verified) values
  ('aaaaaaaa-0001-0001-0001-000000000001','Aisha Rahman',   'aisha_r',   'Software engineer passionate about Islamic fintech and halal investing.','Software Engineer',  'Dubai, UAE',            array['Tech','Finance','Islam'],          true),
  ('aaaaaaaa-0002-0002-0002-000000000002','Omar Farouq',    'omarfarouq','PhD researcher in Islamic economics. Writer at multiple Muslim media outlets.','Research Scholar','Kuala Lumpur, Malaysia',array['Research','Islam','Economics'],    true),
  ('aaaaaaaa-0003-0003-0003-000000000003','Fatima Al-Zahra','fatima_az', 'Biotech startup founder. Muslim women in STEM advocate.','Biotech Founder',    'Riyadh, Saudi Arabia',  array['Science','Health','Startups'],     false),
  ('aaaaaaaa-0004-0004-0004-000000000004','Yusuf Okonkwo',  'yusuf_ok',  'Nigerian-British product designer. Passionate about accessible Islamic education apps.','Product Designer','Lagos, Nigeria',array['Art & Design','Education','Tech'],false),
  ('aaaaaaaa-0005-0005-0005-000000000005','Maryam Hussain', 'maryam_h',  'Full-stack dev & Islamic school curriculum developer. Open source contributor.','Full-Stack Developer','Toronto, Canada',array['Tech','Education','Islam'],       true),
  ('aaaaaaaa-0006-0006-0006-000000000006','Ibrahim Siddiq', 'ibrahim_s', 'Islamic finance consultant. Speaker at IFN global forums.','Finance Consultant','London, UK',            array['Finance','Business','Islam'],      false),
  ('aaaaaaaa-0007-0007-0007-000000000007','Zainab Malik',   'zainab_m',  'Clinical researcher working on halal vaccine certification frameworks.','Clinical Researcher','Islamabad, Pakistan', array['Health','Science','Islam'],        true),
  ('aaaaaaaa-0008-0008-0008-000000000008','Hassan Al-Amin', 'hassan_aa', 'Serial entrepreneur — 3 exits. Angel investor focused on Muslim-led startups.','Entrepreneur','Istanbul, Turkey',      array['Business','Startups','Finance'],   false),
  ('aaaaaaaa-0009-0009-0009-000000000009','Khadijah Noor',  'khadijah_n','Islamic art director and calligrapher. Professor at Cairo University of Fine Arts.','Art Director','Cairo, Egypt',           array['Art & Design','Islam'],            false),
  ('aaaaaaaa-0010-0010-0010-000000000010','Bilal Chaudhry', 'bilal_c',   'Data scientist using AI for Quran memorisation and Islamic scholarship.','Data Scientist','Lahore, Pakistan',      array['Tech','Islam','Research'],         true)
on conflict (id) do nothing;

-- Posts
insert into posts (user_id, content, category, tags) values
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','Alhamdulillah — IMS is live! This is the beginning of something special for the Muslim professional ummah. Share it with your brothers and sisters. #IMS #Ummah','general',array['IMS','Ummah','launch']),
  ('aaaaaaaa-0001-0001-0001-000000000001','Islamic fintech is growing at 15% YoY globally. The opportunity for halal digital banking is enormous — and almost entirely untapped. #Fintech #HalalInvesting','tech',array['Fintech','HalalInvesting']),
  ('aaaaaaaa-0002-0002-0002-000000000002','Just finished my paper on "Digital Waqf Infrastructure in the 21st Century". The potential of blockchain-based waqf to transform Muslim charity is astonishing. #Research #Waqf','science',array['Research','Waqf']),
  ('aaaaaaaa-0003-0003-0003-000000000003','We need more Muslim women in STEM. Period. Representation matters — not just for diversity, but for the quality and ethics of the science we do. #WomenInSTEM','general',array['WomenInSTEM','Islam']),
  ('aaaaaaaa-0005-0005-0005-000000000005','Open sourced our Islamic prayer time calculation library. Pure TypeScript, zero dependencies, supports all major calculation methods. #OpenSource #Tech','tech',array['OpenSource','Tech']),
  ('aaaaaaaa-0006-0006-0006-000000000006','The global Islamic finance market will exceed $5 trillion by 2025. Yet most Muslims have no access to shariah-compliant products. #IslamicFinance','business',array['IslamicFinance','Halal']),
  ('aaaaaaaa-0007-0007-0007-000000000007','Our halal vaccine certification white paper is now submitted to WHO. 3 years of research, 14 countries involved. Bismillah. #Health #HalalCert','science',array['Health','HalalCert']),
  ('aaaaaaaa-0008-0008-0008-000000000008','Looking to invest in early-stage Muslim-led startups in EdTech, HealthTech, and FinTech. If you are building something worth building, reach out. #Startup','business',array['Startup','Investment']),
  ('aaaaaaaa-0004-0004-0004-000000000004','Just dropped a free UI kit for Islamic educational apps — 120+ components, Arabic RTL support. Free for commercial use. #Design #IslamicEd','tech',array['Design','IslamicEd']),
  ('aaaaaaaa-0010-0010-0010-000000000010','My AI model for Tajweed error detection just hit 94% accuracy. Training on 50k+ recitation samples. Publishing on HuggingFace next week. #AI #Quran','tech',array['AI','Quran','Tajweed']);

-- Ideas
insert into ideas (user_id, title, description, category, status, tags) values
  ('aaaaaaaa-0001-0001-0001-000000000001','Halal Stock Screener App','A mobile app that screens global stocks for shariah compliance in real time, with breakdown on interest income, forbidden business lines, and debt ratios.','tech','open',array['fintech','halal','investing']),
  ('aaaaaaaa-0002-0002-0002-000000000002','Digital Waqf Platform','A blockchain-based platform for creating, managing and donating to digital waqf funds. Smart contracts enforce endowment rules automatically.','islam','seeking-contributors',array['waqf','charity','blockchain']),
  ('aaaaaaaa-0005-0005-0005-000000000005','Muslim Talent Network','A LinkedIn alternative for Muslim professionals — Islamic values built in (prayer time reminders, Hijri calendar, halal networking).','tech','in-progress',array['network','jobs','ummah']),
  ('aaaaaaaa-0003-0003-0003-000000000003','Halal Ingredient Scanner','Scan any food barcode and instantly know if it is halal. Crowdsourced and verified ingredient database, supports 40+ countries.','health','open',array['halal','food','mobile']),
  ('aaaaaaaa-0010-0010-0010-000000000010','AI Quran Tutor','Personal AI tutor for Quran memorisation and Tajweed correction. Listens to recitation, identifies mistakes, and suggests targeted practice sessions.','tech','in-progress',array['quran','AI','education']),
  ('aaaaaaaa-0004-0004-0004-000000000004','Islamic Architecture Archive','A global digital archive of Islamic architecture — photos, 3D scans, historical context, and open data for researchers and architects.','art','open',array['architecture','heritage','archive']);

-- Startups
insert into startups (user_id, name, tagline, description, category, goal, raised, stage) values
  ('aaaaaaaa-0008-0008-0008-000000000008','AmanaPay',  'The Islamic neobank for the global ummah',       'AmanaPay offers shariah-compliant current accounts, savings, and investments to Muslims in 40+ countries. No interest. No haram. Just clean banking.','fintech',  500000,127000,'Seed'),
  ('aaaaaaaa-0003-0003-0003-000000000003','BioHalal',  'Certifying the future of halal biotech',         'BioHalal provides end-to-end halal certification for biotech products — vaccines, pharmaceuticals, and cultivated meat.','health',  1000000,620000,'Series A'),
  ('aaaaaaaa-0001-0001-0001-000000000001','HalalChain','Blockchain provenance for halal supply chains',   'Track any halal product from farm to shelf using immutable blockchain records. Built for manufacturers, retailers, and regulators.','tech',    250000, 18000,'Pre-seed'),
  ('aaaaaaaa-0005-0005-0005-000000000005','MadrasaOS', 'Open-source platform for Islamic schools',       'A complete school management platform for madrasas and Islamic schools. Student records, timetables, Quran progress tracking.','education',150000, 44000,'MVP'),
  ('aaaaaaaa-0010-0010-0010-000000000010','TajweedAI', 'AI-powered Quran recitation coach',              'Real-time Tajweed error detection using deep learning. Supports Hafs and Warsh recitation. Used by 12,000+ students globally.','education',300000,198000,'Seed');

-- Research Papers
insert into research_papers (user_id, doi, title, authors, abstract, category, journal, year, upvote_count) values
  ('aaaaaaaa-0002-0002-0002-000000000002','10.9999/waqf.2024.001', 'Digital Waqf Infrastructure: Blockchain Applications in Islamic Endowment Law',  array['Omar Farouq','Ahmad Khalid'],      'Examines compatibility of blockchain smart contracts with classical waqf jurisprudence across four major madhabs, proposing a hybrid governance model.','islam',  'Journal of Islamic Finance',  2024,47),
  ('aaaaaaaa-0007-0007-0007-000000000007','10.9999/hlth.2024.002', 'Halal Vaccine Certification: A Multi-Country Framework Analysis',                 array['Zainab Malik','Hassan Al-Amin'],    'Systematic review of halal vaccine certification standards across 14 OIC member states. Proposes a unified WHO-compatible certification protocol.','health', 'The Lancet Regional Health',  2024,89),
  ('aaaaaaaa-0010-0010-0010-000000000010','10.9999/ieee.2024.003', 'Deep Learning for Tajweed Error Detection in Quranic Recitation',                 array['Bilal Chaudhry'],                   'CNN-LSTM architecture trained on 50,000 annotated recitation samples achieving 94.2% accuracy in Tajweed rule violation detection.','science','IEEE Access',                  2024,63),
  ('aaaaaaaa-0003-0003-0003-000000000003','10.9999/eth.2024.004',  'Stem Cell Therapy and Islamic Bioethics: A Contemporary Fiqh Analysis',          array['Fatima Al-Zahra','Maryam Hussain'], 'Analysis of permissibility and ethical constraints for stem cell therapies under Islamic law, drawing on fatwas from major Islamic councils.','health', 'Journal of Medical Ethics',   2024,38),
  ('aaaaaaaa-0006-0006-0006-000000000006','10.9999/ies.2024.005',  'Sukuk Issuance and Sovereign Debt: Evidence from GCC Markets 2010-2024',         array['Ibrahim Siddiq','Omar Farouq'],     'Empirical analysis of sukuk patterns in GCC sovereign debt markets. Sukuk issuance reduces borrowing costs by average 42bps vs conventional bonds.','business','Islamic Economic Studies',   2024,29);

-- Events
insert into events (user_id, title, description, category, type, location, starts_at) values
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','IMS Launch Community Call',            'Join the founding community of IMS for a live call. Meet the team, ask questions, shape the future of the platform.','tech',    'online',    'Online (Zoom)',          now() + interval '7 days'),
  ('aaaaaaaa-0006-0006-0006-000000000006','IFN Global Islamic Finance Forum 2026', 'The world''s largest Islamic finance gathering. 3 days, 200+ speakers, 5000+ attendees from 60 countries.','business','in-person','Dubai, UAE',             now() + interval '30 days'),
  ('aaaaaaaa-0002-0002-0002-000000000002','Islamic Economics Symposium',           'Annual symposium for researchers in Islamic economics, banking and finance. Paper submissions open.','science', 'in-person','Kuala Lumpur, Malaysia', now() + interval '45 days'),
  ('aaaaaaaa-0005-0005-0005-000000000005','Muslim Developers Hackathon 2026',      '48-hour hackathon for Muslim developers. Build tools for the ummah — prizes up to $10,000.','tech',    'hybrid',    'London + Online',        now() + interval '14 days'),
  ('aaaaaaaa-0003-0003-0003-000000000003','Women in Muslim STEM — Mentorship Day', 'A full day of talks, workshops and 1:1 mentorship for Muslim women in science, technology, engineering and maths.','science', 'online',    'Online',                 now() + interval '21 days');

-- Jobs
insert into jobs (user_id, title, company, description, category, type, location_type, location, salary) values
  ('aaaaaaaa-0001-0001-0001-000000000001','Senior Backend Engineer',     'AmanaPay',         'Build infrastructure for the next generation of Islamic banking. Node.js, PostgreSQL, AWS.','tech',    'full-time','remote','Remote',                '$120k-$160k'),
  ('aaaaaaaa-0003-0003-0003-000000000003','Regulatory Affairs Lead',     'BioHalal',         'Lead halal certification submissions across MENA and SE Asia. Deep knowledge of Islamic jurisprudence required.','health',  'full-time','onsite','Riyadh, Saudi Arabia', '$90k-$130k'),
  ('aaaaaaaa-0008-0008-0008-000000000008','Investment Analyst',          'Amana Ventures',   'Source and execute investments into early-stage Muslim-led startups. 2+ years VC experience required.','business','full-time','onsite','Istanbul, Turkey',    '$70k-$100k'),
  ('aaaaaaaa-0005-0005-0005-000000000005','Frontend Engineer (Next.js)', 'MadrasaOS',        'Help build the best school management platform for Islamic education. Open source culture. Remote-first.','tech',    'part-time','remote','Remote',                '$50k-$70k'),
  ('aaaaaaaa-0004-0004-0004-000000000004','UI/UX Designer',              'IMS Platform',     'Design accessible experiences for the global Muslim professional network. Arabic RTL experience preferred.','tech',    'contract', 'remote','Remote',                '$60k-$85k'),
  ('aaaaaaaa-0002-0002-0002-000000000002','Islamic Finance Researcher',  'ISRA International','Research at the world''s leading Islamic finance research institution. Open to final-year students.','business','volunteer','onsite','Kuala Lumpur, Malaysia','Stipend');

-- Groups
insert into groups (user_id, name, description, category, type, member_count) values
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','IMS Core Community',            'Official IMS group. Announcements, updates, and discussions from the founding team.','islam',   'public', 1),
  ('aaaaaaaa-0001-0001-0001-000000000001','Muslim FinTech Builders',       'For builders working on Islamic finance and halal fintech. Share ideas, get feedback, find co-founders.','business','public', 0),
  ('aaaaaaaa-0010-0010-0010-000000000010','AI for Islamic Knowledge',      'AI applications in Islamic scholarship, Quran memorisation, hadith research, and Islamic education.','tech',    'public', 0),
  ('aaaaaaaa-0002-0002-0002-000000000002','Islamic Economics Research Net','Private group for academic researchers in Islamic economics, finance, and law.','islam',   'private',0),
  ('aaaaaaaa-0003-0003-0003-000000000003','Muslim Women in STEM',          'Support network for Muslim women in science, technology, engineering, and mathematics globally.','science', 'public', 0);

-- Follows
insert into follows (follower_id, following_id) values
  ('aaaaaaaa-0001-0001-0001-000000000001','24a14e8e-feed-49e8-9dad-e9eb574770c9'),
  ('aaaaaaaa-0002-0002-0002-000000000002','24a14e8e-feed-49e8-9dad-e9eb574770c9'),
  ('aaaaaaaa-0003-0003-0003-000000000003','24a14e8e-feed-49e8-9dad-e9eb574770c9'),
  ('aaaaaaaa-0005-0005-0005-000000000005','24a14e8e-feed-49e8-9dad-e9eb574770c9'),
  ('aaaaaaaa-0010-0010-0010-000000000010','24a14e8e-feed-49e8-9dad-e9eb574770c9'),
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','aaaaaaaa-0001-0001-0001-000000000001'),
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','aaaaaaaa-0002-0002-0002-000000000002'),
  ('24a14e8e-feed-49e8-9dad-e9eb574770c9','aaaaaaaa-0010-0010-0010-000000000010'),
  ('aaaaaaaa-0008-0008-0008-000000000008','aaaaaaaa-0001-0001-0001-000000000001'),
  ('aaaaaaaa-0006-0006-0006-000000000006','aaaaaaaa-0002-0002-0002-000000000002'),
  ('aaaaaaaa-0001-0001-0001-000000000001','aaaaaaaa-0010-0010-0010-000000000010'),
  ('aaaaaaaa-0004-0004-0004-000000000004','aaaaaaaa-0003-0003-0003-000000000003')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════
-- Done! Your account (maaz) is now ADMIN.
-- Tables created + 10 users, 10 posts, 6 ideas, 5 startups,
-- 5 papers, 5 events, 6 jobs, 5 groups, follows seeded.
-- ═══════════════════════════════════════════════════════════

-- ── Zone posts (World Intelligence Map) ──────────────────
create table if not exists zone_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  brief text not null,
  category text not null default 'general',
  lat float not null,
  lng float not null,
  region text,
  country text,
  tags text[] default '{}',
  severity text default 'medium' check (severity in ('low','medium','high','critical')),
  created_at timestamptz default now()
);
alter table zone_posts enable row level security;
drop policy if exists "zone_posts_read"   on zone_posts;
drop policy if exists "zone_posts_insert" on zone_posts;
create policy "zone_posts_read"   on zone_posts for select using (true);
create policy "zone_posts_insert" on zone_posts for insert with check (auth.uid() = user_id);

-- ── Zone votes + post_type ────────────────────────────────
alter table zone_posts add column if not exists post_type text default 'zone' check (post_type in ('zone','plot'));

create table if not exists zone_votes (
  zone_id uuid references zone_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  vote smallint not null check (vote in (1,-1)),
  primary key (zone_id, user_id)
);
alter table zone_votes enable row level security;
drop policy if exists "zone_votes_read"   on zone_votes;
drop policy if exists "zone_votes_write"  on zone_votes;
drop policy if exists "zone_votes_delete" on zone_votes;
create policy "zone_votes_read"   on zone_votes for select using (true);
create policy "zone_votes_write"  on zone_votes for insert with check (auth.uid() = user_id);
create policy "zone_votes_delete" on zone_votes for delete using (auth.uid() = user_id);
