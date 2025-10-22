-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.waste_stations enable row level security;
alter table public.waste_bins enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.redemptions enable row level security;
alter table public.news_articles enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_completions enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Waste stations policies
create policy "Everyone can view waste stations"
  on public.waste_stations for select
  using (true);

create policy "Workers and admins can update stations"
  on public.waste_stations for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('worker', 'admin')
    )
  );

create policy "Admins can insert stations"
  on public.waste_stations for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Waste bins policies
create policy "Everyone can view waste bins"
  on public.waste_bins for select
  using (true);

create policy "Workers and admins can update bins"
  on public.waste_bins for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('worker', 'admin')
    )
  );

create policy "Admins can insert bins"
  on public.waste_bins for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Products policies
create policy "Everyone can view available products"
  on public.products for select
  using (is_available = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('worker', 'admin')
  ));

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Redemptions policies
create policy "Users can view own redemptions"
  on public.redemptions for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Users can create redemptions"
  on public.redemptions for insert
  with check (auth.uid() = user_id);

create policy "Admins can update redemptions"
  on public.redemptions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- News articles policies
create policy "Everyone can view published articles"
  on public.news_articles for select
  using (published = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can manage articles"
  on public.news_articles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quizzes policies
create policy "Everyone can view active quizzes"
  on public.quizzes for select
  using (is_active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can manage quizzes"
  on public.quizzes for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz questions policies
create policy "Everyone can view quiz questions"
  on public.quiz_questions for select
  using (true);

create policy "Admins can manage quiz questions"
  on public.quiz_questions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz completions policies
create policy "Users can view own completions"
  on public.quiz_completions for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Users can insert own completions"
  on public.quiz_completions for insert
  with check (auth.uid() = user_id);
