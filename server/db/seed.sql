insert into users (id, email, password_hash, first_name, last_name, role, phone)
values
  ('11111111-1111-1111-1111-111111111111', 'patient@example.com', 'password123', 'Taylor', 'Patient', 'patient', '555-0100'),
  ('22222222-2222-2222-2222-222222222222', 'provider@example.com', 'password123', 'Jordan', 'Provider', 'provider', '555-0200')
on conflict (email) do nothing;

insert into patient_profiles (user_id, date_of_birth, gender, blood_type, allergies, conditions)
values
  ('11111111-1111-1111-1111-111111111111', '1990-06-15', 'female', 'O+', array['pollen'], array['hypertension'])
on conflict do nothing;

insert into provider_profiles (user_id, specialty, years_experience, accepting_new_patients, languages, rating, review_count)
values
  ('22222222-2222-2222-2222-222222222222', 'Cardiology', 8, true, array['English'], 4.9, 18)
on conflict do nothing;

insert into provider_schedules (provider_id, day_of_week, start_time, end_time, slot_duration)
values
  ('22222222-2222-2222-2222-222222222222', 1, '09:00', '17:00', 30),
  ('22222222-2222-2222-2222-222222222222', 3, '09:00', '17:00', 30),
  ('22222222-2222-2222-2222-222222222222', 5, '09:00', '17:00', 30)
on conflict do nothing;

insert into appointments (patient_id, provider_id, scheduled_date, scheduled_time, duration, appointment_type, status, reason, is_telehealth)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', current_date + 2, '10:00', 30, 'Consultation', 'confirmed', 'Annual checkup', true)
on conflict do nothing;

insert into vital_measurements (user_id, measurement_date, heart_rate, systolic_bp, diastolic_bp, o2_saturation, blood_glucose, body_temperature, respiratory_rate, notes)
values
  ('default_user', current_date - 1, 72, 118, 76, 98, 92, 98.6, 16, 'Baseline vitals');

