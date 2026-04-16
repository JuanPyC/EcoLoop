-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum for user roles
create type user_role as enum ('user', 'worker', 'admin');

-- Create enum for waste types
create type waste_type as enum ('recyclable', 'non_recyclable', 'organic');

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'user',
  eco_points integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Waste stations table
create table if not exists public.waste_stations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Waste bins table (3 per station)
create table if not exists public.waste_bins (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid not null references public.waste_stations(id) on delete cascade,
  waste_type waste_type not null,
  capacity_percentage integer not null default 0 check (capacity_percentage >= 0 and capacity_percentage <= 100),
  needs_attention boolean not null default false,
  qr_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(station_id, waste_type)
);

-- Products table for the store
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  is_available boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions table (QR scans)
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bin_id uuid not null references public.waste_bins(id) on delete cascade,
  points_earned integer not null,
  waste_type waste_type not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Redemptions table (store purchases)
create table if not exists public.redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  points_spent integer not null,
  quantity integer not null default 1,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- News articles table
create table if not exists public.news_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  published boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quizzes table
create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  points_reward integer not null default 10,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quiz questions table
create table if not exists public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  correct_answer text not null,
  wrong_answer_1 text not null,
  wrong_answer_2 text not null,
  wrong_answer_3 text not null,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quiz completions table
create table if not exists public.quiz_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null,
  points_earned integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, quiz_id)
);

-- Create indexes for better performance
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_waste_bins_station on public.waste_bins(station_id);
create index if not exists idx_waste_bins_qr on public.waste_bins(qr_code);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_bin on public.transactions(bin_id);
create index if not exists idx_redemptions_user on public.redemptions(user_id);
create index if not exists idx_quiz_questions_quiz on public.quiz_questions(quiz_id);
create index if not exists idx_quiz_completions_user on public.quiz_completions(user_id);
