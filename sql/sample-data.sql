insert into public.cars (name, category, base_price, per_km, image_url) values
('Swift DZire', 'sedan', 3500, 18, null),
('Innova Crysta', 'suv', 5500, 22, null),
('Fortuner', 'luxury', 8500, 28, null)
on conflict (id) do nothing;

insert into public.price_rules (rule_name, type, scope, value, active) values
('Srinagar Discount', 'discount', 'srinagar', -0.15, true),
('Outside Surcharge', 'surcharge', 'outside_srinagar', 0.10, true),
('Weekend Uplift', 'multiplier', 'weekend', 1.10, true)
on conflict (id) do nothing;
