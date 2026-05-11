USE app_db;

INSERT INTO admin_users (id, full_name, email, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Admin MPJ', 'admin@mpj.local', 'super_admin'),
  ('00000000-0000-0000-0000-000000000002', 'Panitia Scanner', 'scanner@mpj.local', 'scanner')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role);

INSERT INTO bank_accounts (id, bank_name, account_number, account_name)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Bank Syariah Indonesia', '7001234567', 'Media Pondok Jatim')
ON DUPLICATE KEY UPDATE
  bank_name = VALUES(bank_name),
  account_number = VALUES(account_number),
  account_name = VALUES(account_name);

INSERT INTO speakers (id, nama_lengkap, alamat, keahlian, no_telp, portfolio_url, kategori, foto_path, bio)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Ustadz Ahmad Zain',
    'Jakarta',
    JSON_ARRAY('Public Speaking', 'Media Dakwah'),
    '6281234567890',
    NULL,
    'Keagamaan',
    '/images/speakers/demo-speaker.jpg',
    'Narasumber demo untuk validasi alur event.'
  )
ON DUPLICATE KEY UPDATE
  nama_lengkap = VALUES(nama_lengkap),
  keahlian = VALUES(keahlian),
  kategori = VALUES(kategori);

INSERT INTO events (
  id,
  title,
  category,
  event_type,
  poster_path,
  description,
  location_name,
  location_gmaps,
  start_date,
  registration_deadline,
  is_open_for_public,
  is_paid,
  price_niam,
  price_public,
  max_participants,
  status,
  payment_method,
  bank_account_id,
  speaker_id,
  created_by
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    'Pelatihan Media Dakwah Digital',
    'Pelatihan',
    'Non-Kelas',
    'https://picsum.photos/seed/mpj-event/800/500',
    'Event demo untuk menguji registrasi, pembayaran, tiket QR, dan scan absensi.',
    'Aula MPJ Pusat',
    'https://maps.google.com',
    '2026-06-15 09:00:00',
    '2026-06-10 23:59:59',
    1,
    1,
    25000,
    100000,
    120,
    'APPROVED',
    'manual',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  status = VALUES(status),
  max_participants = VALUES(max_participants);

INSERT INTO crew_members (id, niam, full_name, unit, photo_path)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'MPJ-001', 'Budi Santoso', 'Regional Jakarta', 'https://picsum.photos/seed/budi/200/200')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  unit = VALUES(unit);

INSERT INTO event_guests (id, full_name, institution_name, whatsapp, id_card_path)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'Siti Rahayu', 'Komunitas Umum', '6281111111111', NULL)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  institution_name = VALUES(institution_name);

INSERT INTO event_participants (
  id,
  event_id,
  crew_id,
  guest_id,
  registration_path,
  payment_status,
  unique_amount,
  attendance_status,
  qr_token
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    NULL,
    'NIAM',
    'Paid',
    25012,
    'Registered',
    'TOKEN-NIAM-001'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    NULL,
    '50000000-0000-0000-0000-000000000001',
    'UMUM',
    'Pending_Approval',
    100034,
    'Registered',
    'TOKEN-UMUM-002'
  )
ON DUPLICATE KEY UPDATE
  payment_status = VALUES(payment_status),
  unique_amount = VALUES(unique_amount);

INSERT INTO payments (participant_id, amount, status, proof_path, submitted_at, verified_by, verified_at)
SELECT id, unique_amount, payment_status, payment_proof_path, created_at,
  CASE WHEN payment_status = 'Paid' THEN '00000000-0000-0000-0000-000000000001' ELSE NULL END,
  CASE WHEN payment_status = 'Paid' THEN NOW() ELSE NULL END
FROM event_participants
WHERE id IN (
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000002'
)
AND NOT EXISTS (
  SELECT 1 FROM payments existing
  WHERE existing.participant_id = event_participants.id
);
