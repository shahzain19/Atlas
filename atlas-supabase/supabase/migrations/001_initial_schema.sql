-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- For vector search (semantic memory)
-- create extension if not exists "vector";    -- pgvector, enable when available

-- Events table (for STM/LTM/event sourcing)
create table if not exists events (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null,
  source        text,
  payload       jsonb default '{}',
  priority      integer default 0,
  category      text,
  importance    real default 0.0,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);
create index idx_events_type on events(type);
create index idx_events_created_at on events(created_at desc);
create index idx_events_category on events(category);
create index idx_events_importance on events(importance desc);

-- World objects table
create table if not exists world_objects (
  id            uuid primary key default uuid_generate_v4(),
  object_type   text not null,
  label         text,
  position_x    real not null default 0,
  position_y    real not null default 0,
  position_z    real not null default 0,
  velocity_x    real,
  velocity_y    real,
  velocity_z    real,
  size_width    real,
  size_height   real,
  size_depth    real,
  confidence    real default 1.0,
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index idx_objects_type on world_objects(object_type);

-- Knowledge graph nodes
create table if not exists graph_nodes (
  id            uuid primary key default uuid_generate_v4(),
  node_type     text not null,
  label         text,
  properties    jsonb default '{}',
  created_at    timestamptz default now()
);
create index idx_nodes_type on graph_nodes(node_type);

-- Knowledge graph edges
create table if not exists graph_edges (
  id            uuid primary key default uuid_generate_v4(),
  source_id     uuid not null references graph_nodes(id) on delete cascade,
  target_id     uuid not null references graph_nodes(id) on delete cascade,
  edge_type     text not null,
  label         text,
  weight        real default 1.0,
  properties    jsonb default '{}',
  created_at    timestamptz default now()
);
create index idx_edges_source on graph_edges(source_id);
create index idx_edges_target on graph_edges(target_id);
create index idx_edges_type on graph_edges(edge_type);

-- Memory entries table (for semantic/vector search)
create table if not exists memory_entries (
  id            uuid primary key default uuid_generate_v4(),
  content       text not null,
  embedding     real[] default '{}',
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);
create index idx_memory_created_at on memory_entries(created_at desc);

-- System config table
create table if not exists system_config (
  key           text primary key,
  value         jsonb not null,
  updated_at    timestamptz default now()
);
