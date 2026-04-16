-- Add DELETE policies for waste stations and bins

-- Allow admins to delete waste stations
create policy "Admins can delete stations"
  on public.waste_stations for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to delete waste bins
create policy "Admins can delete bins"
  on public.waste_bins for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Also add delete policy for profiles (admins should be able to delete users)
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
