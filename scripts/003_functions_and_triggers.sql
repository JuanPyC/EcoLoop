-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  return new;
end;
$$;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add updated_at triggers
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.waste_stations
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.waste_bins
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.news_articles
  for each row
  execute function public.handle_updated_at();

-- Function to update user points after transaction
create or replace function public.update_user_points_after_transaction()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set eco_points = eco_points + new.points_earned
  where id = new.user_id;
  return new;
end;
$$;

create trigger update_points_on_transaction
  after insert on public.transactions
  for each row
  execute function public.update_user_points_after_transaction();

-- Function to deduct points after redemption
create or replace function public.deduct_points_after_redemption()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set eco_points = eco_points - new.points_spent
  where id = new.user_id;
  
  update public.products
  set stock = stock - new.quantity
  where id = new.product_id;
  
  return new;
end;
$$;

create trigger deduct_points_on_redemption
  after insert on public.redemptions
  for each row
  execute function public.deduct_points_after_redemption();

-- Function to update bin attention status
create or replace function public.update_bin_attention_status()
returns trigger
language plpgsql
as $$
begin
  if new.capacity_percentage >= 80 then
    new.needs_attention = true;
  else
    new.needs_attention = false;
  end if;
  return new;
end;
$$;

create trigger check_bin_capacity
  before update on public.waste_bins
  for each row
  execute function public.update_bin_attention_status();
