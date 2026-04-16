-- Insert sample waste stations
insert into public.waste_stations (id, name, location, description) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Estación Principal', 'Edificio A - Planta Baja', 'Estación principal cerca de la cafetería'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Estación Biblioteca', 'Biblioteca - Segundo Piso', 'Estación ubicada en la entrada de la biblioteca'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Estación Deportiva', 'Gimnasio - Área Exterior', 'Estación cerca de las canchas deportivas');

-- Insert waste bins for each station (3 types per station)
insert into public.waste_bins (station_id, waste_type, capacity_percentage, qr_code) values
  -- Estación Principal
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 45, 'QR-MAIN-REC-001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'non_recyclable', 60, 'QR-MAIN-NON-001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'organic', 30, 'QR-MAIN-ORG-001'),
  -- Estación Biblioteca
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'recyclable', 85, 'QR-LIB-REC-001'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'non_recyclable', 70, 'QR-LIB-NON-001'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'organic', 50, 'QR-LIB-ORG-001'),
  -- Estación Deportiva
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'recyclable', 55, 'QR-SPORT-REC-001'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'non_recyclable', 90, 'QR-SPORT-NON-001'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'organic', 40, 'QR-SPORT-ORG-001');

-- Insert sample products
insert into public.products (name, description, points_cost, category, stock, image_url) values
  ('Cuaderno Ecológico', 'Cuaderno de 100 hojas recicladas', 50, 'Papelería', 100, '/placeholder.svg?height=200&width=200'),
  ('Lápices de Colores', 'Set de 12 lápices de colores', 30, 'Papelería', 150, '/placeholder.svg?height=200&width=200'),
  ('Mochila Reciclada', 'Mochila hecha con materiales reciclados', 200, 'Accesorios', 50, '/placeholder.svg?height=200&width=200'),
  ('Botella Reutilizable', 'Botella de acero inoxidable 500ml', 80, 'Accesorios', 80, '/placeholder.svg?height=200&width=200'),
  ('Libro de Ecología', 'Guía práctica de sostenibilidad', 120, 'Libros', 60, '/placeholder.svg?height=200&width=200'),
  ('Calculadora Solar', 'Calculadora científica con panel solar', 100, 'Tecnología', 70, '/placeholder.svg?height=200&width=200'),
  ('Set de Reglas', 'Set de reglas y escuadras', 40, 'Papelería', 120, '/placeholder.svg?height=200&width=200'),
  ('Borrador Ecológico', 'Pack de 5 borradores biodegradables', 20, 'Papelería', 200, '/placeholder.svg?height=200&width=200');

-- Insert sample news articles
insert into public.news_articles (title, content, published, image_url) values
  ('¡Bienvenido a EcoLoop!', 'EcoLoop es tu nueva plataforma para contribuir al medio ambiente mientras ganas recompensas. Escanea códigos QR en los puntos de reciclaje y acumula EcoPoints.', true, '/placeholder.svg?height=400&width=600'),
  ('Consejos para Reciclar Correctamente', 'Aprende a separar tus residuos correctamente: Reciclables (papel, cartón, plástico, vidrio), No reciclables (residuos sanitarios, pañales), Orgánicos (restos de comida, cáscaras).', true, '/placeholder.svg?height=400&width=600'),
  ('Nuevo Sistema de Puntos', 'Ahora puedes ganar más puntos completando quizzes sobre medio ambiente. ¡Aprende y gana!', true, '/placeholder.svg?height=400&width=600');

-- Insert sample quiz
insert into public.quizzes (id, title, description, points_reward, is_active) values
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Conocimientos Básicos de Reciclaje', 'Pon a prueba tus conocimientos sobre reciclaje', 15, true);

-- Insert quiz questions
insert into public.quiz_questions (quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index) values
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Qué tipo de residuo es una botella de plástico?', 'Reciclable', 'Orgánico', 'No reciclable', 'Peligroso', 1),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Dónde se deben depositar las cáscaras de frutas?', 'Orgánico', 'Reciclable', 'No reciclable', 'Vidrio', 2),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Cuánto tiempo tarda en degradarse una botella de plástico?', '450 años', '10 años', '1 año', '100 años', 3),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Qué porcentaje de plástico se recicla globalmente?', '9%', '50%', '75%', '25%', 4),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Cuál de estos materiales NO es reciclable?', 'Pañales usados', 'Papel', 'Cartón', 'Latas de aluminio', 5);
