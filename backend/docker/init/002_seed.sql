INSERT INTO users (email, password_hash, full_name, role, eco_points)
VALUES
  ('admin@ecoloop.local', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36q8t4Qce4xD9V7j6FMfA3K', 'Admin Local', 'admin', 1000),
  ('worker@ecoloop.local', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36q8t4Qce4xD9V7j6FMfA3K', 'Worker Local', 'worker', 0),
  ('user@ecoloop.local', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36q8t4Qce4xD9V7j6FMfA3K', 'Usuario Local', 'user', 120)
ON CONFLICT (email) DO NOTHING;

INSERT INTO waste_stations (name, location, description)
VALUES
  ('Estacion Norte', 'Edificio A', 'Punto de reciclaje principal'),
  ('Estacion Sur', 'Edificio B', 'Punto de reciclaje secundario')
ON CONFLICT DO NOTHING;

INSERT INTO waste_bins (station_id, waste_type, capacity_percentage, current_weight, needs_attention, qr_code)
SELECT ws.id, t.waste_type, 0, 0, false, t.qr_code
FROM waste_stations ws
JOIN (
  VALUES
    ('Estacion Norte', 'recyclable', 'QR-NORTH-REC'),
    ('Estacion Norte', 'organic', 'QR-NORTH-ORG'),
    ('Estacion Norte', 'non_recyclable', 'QR-NORTH-NREC'),
    ('Estacion Sur', 'recyclable', 'QR-SOUTH-REC'),
    ('Estacion Sur', 'organic', 'QR-SOUTH-ORG'),
    ('Estacion Sur', 'non_recyclable', 'QR-SOUTH-NREC')
) AS t(station_name, waste_type, qr_code)
  ON ws.name = t.station_name
ON CONFLICT (qr_code) DO NOTHING;

INSERT INTO products (name, description, points_cost, image_url, stock, category, is_available)
VALUES
  ('Botella Reutilizable', 'Botella metalica 500ml', 120, NULL, 25, 'hogar', true),
  ('Cuaderno Ecologico', 'Cuaderno con papel reciclado', 80, NULL, 40, 'escolar', true),
  ('Bolsa Reutilizable', 'Bolsa de tela EcoLoop', 60, NULL, 30, 'hogar', true)
ON CONFLICT DO NOTHING;

INSERT INTO news_articles (title, content, published)
VALUES
  ('Bienvenido a EcoLoop', 'Ya puedes reciclar y acumular EcoPoints desde hoy.', true),
  ('Nueva estacion activa', 'La Estacion Sur ya se encuentra disponible.', true)
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (title, description, points_reward, is_active)
VALUES
  ('Reciclaje Basico', 'Conceptos basicos de separacion de residuos.', 20, true)
ON CONFLICT DO NOTHING;
