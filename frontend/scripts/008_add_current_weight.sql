-- Add current_weight field to waste_bins table
alter table public.waste_bins
add column if not exists current_weight numeric(10, 2) not null default 0 check (current_weight >= 0);

-- Add comment to explain the field
comment on column public.waste_bins.current_weight is 'Current weight of waste in the bin (kg). Maximum capacity is 120kg per bin.';

-- Update existing bins to have 0 weight
update public.waste_bins
set current_weight = 0
where current_weight is null;
