create extension if not exists "uuid-ossp";

create table if not exists users (
    id uuid primary key default uuid_generate_v4 (),
    email text not null,
    password_hash text not null,
    first_name text not null,
    last_name text not null,
    role text not null,
    phone text,
    created_at timestamptz default now()
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'users_email_key'
      and conrelid = 'users'::regclass
  ) then
    alter table users drop constraint users_email_key;
  end if;
end $$;

create unique index if not exists users_email_role_unique_idx
  on users (lower(email), role);

create table if not exists provider_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  specialty text,
  credentials text,
  npi text,
  bio text,
  years_experience int,
  accepting_new_patients boolean default true,
  languages text[] default '{}'::text[],
  consultation_fee numeric,
  rating numeric default 4.8,
  review_count int default 0,
  profile_image text
);

create table if not exists patient_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date_of_birth date,
  gender text,
  blood_type text,
  allergies text[] default '{}'::text[],
  conditions text[] default '{}'::text[],
  medications text[] default '{}'::text[],
  insurance_provider text,
  insurance_id text
);

create table if not exists provider_schedules (
    id uuid primary key default uuid_generate_v4 (),
    provider_id uuid references users (id) on delete cascade,
    day_of_week int not null,
    start_time time not null,
    end_time time not null,
    slot_duration int default 30,
    is_active boolean default true
);

create table if not exists appointments (
    id uuid primary key default uuid_generate_v4 (),
    patient_id uuid references users (id) on delete set null,
    provider_id uuid references users (id) on delete set null,
    scheduled_date date not null,
    scheduled_time time not null,
    duration int default 30,
    appointment_type text,
    status text default 'scheduled',
    reason text,
    notes text,
    is_telehealth boolean default false,
    telehealth_room_name text,
    telehealth_room_url text,
    created_at timestamptz default now()
);

create table if not exists medications (
    id uuid primary key default uuid_generate_v4 (),
    patient_id uuid references users (id) on delete cascade,
    provider_id uuid references users (id) on delete cascade,
    medication_name text not null,
    dosage text,
    frequency text,
    start_date date,
    end_date date,
    instructions text,
    is_active boolean default true,
    created_at timestamptz default now()
);

create table if not exists messages (
    id uuid primary key default uuid_generate_v4 (),
    sender_id uuid references users (id) on delete cascade,
    receiver_id uuid references users (id) on delete cascade,
    content text not null,
    is_read boolean default false,
    created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid references users (id) on delete cascade,
    plan_id text not null,
    status text default 'active',
    billing_cycle text default 'monthly',
    started_at timestamptz default now(),
    canceled_at timestamptz,
    trial_ends_at timestamptz,
    stripe_customer_id text,
    stripe_subscription_id text
);

create table if not exists payment_history (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid references users (id) on delete cascade,
    plan_id text,
    amount numeric,
    status text,
    created_at timestamptz default now()
);

create table if not exists vital_measurements (
    id uuid primary key default uuid_generate_v4 (),
    user_id text not null,
    measurement_date date not null,
    heart_rate int,
    systolic_bp int,
    diastolic_bp int,
    o2_saturation numeric,
    blood_glucose numeric,
    body_temperature numeric,
    respiratory_rate numeric,
    notes text
);

create table if not exists lab_results (
    id uuid primary key default uuid_generate_v4 (),
    user_id text not null,
    test_date date not null,
    test_name text not null,
    test_value numeric,
    unit text,
    category text,
    status text,
    normal_range text
);

create table if not exists scan_results (
    id uuid primary key default uuid_generate_v4 (),
    user_id text not null,
    scan_date date not null,
    scan_type text not null,
    area text,
    plaque_detected boolean default false,
    plaque_level text,
    arterial_health numeric,
    blood_flow text,
    notes text
);

create table if not exists health_goals (
    id uuid primary key default uuid_generate_v4 (),
    user_id text not null,
    goal_type text,
    target_metric text,
    target_value numeric,
    current_value numeric,
    unit text,
    start_date date,
    target_date date,
    status text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists clinical_assessments (
    id uuid primary key default uuid_generate_v4 (),
    patient_id uuid references users (id) on delete set null,
    provider_id uuid references users (id) on delete set null,
    status text default 'submitted',
    ros_answers jsonb,
    assessment jsonb,
    vitals jsonb,
    created_at timestamptz default now()
);

create table if not exists patient_ros (
    id uuid primary key default uuid_generate_v4 (),
    patient_id uuid unique references users (id) on delete set null,
    ros_answers jsonb,
    updated_at timestamptz default now()
);

create table if not exists treatment_plans (
    id uuid primary key default uuid_generate_v4 (),
    clinical_assessment_id uuid references clinical_assessments (id) on delete set null,
    patient_id uuid references users (id) on delete set null,
    provider_id uuid references users (id) on delete set null,
    status text default 'finalized',
    plan jsonb,
    created_at timestamptz default now(),
    acknowledged_at timestamptz
);

create table if not exists scribe_notes (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references appointments(id) on delete cascade,
  patient_id uuid references users(id) on delete set null,
  provider_id uuid references users(id) on delete set null,
  transcript text,
  draft_note text,
  final_note text,
  icd_codes jsonb default '[]'::jsonb,
  cpt_codes jsonb default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  finalized_at timestamptz,
  finalized_by uuid references users(id) on delete set null
);

create table if not exists telehealth_recordings (
    id uuid primary key default uuid_generate_v4 (),
    provider_id uuid references users (id) on delete set null,
    room_name text not null,
    recording_id text,
    status text,
    download_url text,
    started_at timestamptz default now(),
    ended_at timestamptz,
    created_at timestamptz default now()
);
