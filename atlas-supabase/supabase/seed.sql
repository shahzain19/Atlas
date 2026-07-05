-- Seed data for Atlas
insert into system_config (key, value) values
  ('agent_name', '"Atlas"'),
  ('agent_version', '"1.0.0"'),
  ('spatial_origin', '{"x": 0, "y": 0, "z": 0}')
on conflict (key) do nothing;
