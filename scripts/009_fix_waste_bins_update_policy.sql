-- Fix waste bins update policy to allow users to update capacity and weight when depositing waste
-- This policy allows authenticated users to update capacity_percentage, current_weight, and needs_attention

create policy "Users can update bin capacity when depositing"
  on public.waste_bins for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Note: This policy works alongside the existing "Workers and admins can update bins" policy
-- Multiple update policies are combined with OR, so both workers/admins AND regular users can update bins
