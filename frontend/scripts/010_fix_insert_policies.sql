-- Fix INSERT policies for products, news_articles, and quizzes
-- The "for all" policies need explicit WITH CHECK clauses for INSERT operations

-- Drop the generic "for all" policies and recreate them with proper INSERT policies
drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Admins can manage articles" on public.news_articles;
drop policy if exists "Admins can manage quizzes" on public.quizzes;
drop policy if exists "Admins can manage quiz questions" on public.quiz_questions;

-- Products policies
create policy "Admins can insert products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update products"
  on public.products for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete products"
  on public.products for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- News articles policies
create policy "Admins can insert articles"
  on public.news_articles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update articles"
  on public.news_articles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete articles"
  on public.news_articles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quizzes policies
create policy "Admins can insert quizzes"
  on public.quizzes for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update quizzes"
  on public.quizzes for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete quizzes"
  on public.quizzes for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz questions policies
create policy "Admins can insert quiz questions"
  on public.quiz_questions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update quiz questions"
  on public.quiz_questions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete quiz questions"
  on public.quiz_questions for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
