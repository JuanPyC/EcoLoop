-- ============================================================
-- EcoLoop Database Schema
-- Ejecutar en orden: tablas → RLS → funciones → seed
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'worker', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE waste_type AS ENUM ('recyclable', 'non_recyclable', 'organic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  eco_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.waste_stations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  location text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.waste_bins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id uuid NOT NULL REFERENCES public.waste_stations(id) ON DELETE CASCADE,
  waste_type waste_type NOT NULL,
  capacity_percentage integer NOT NULL DEFAULT 0 CHECK (capacity_percentage >= 0 AND capacity_percentage <= 100),
  needs_attention boolean NOT NULL DEFAULT false,
  qr_code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(station_id, waste_type)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  image_url text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bin_id uuid NOT NULL REFERENCES public.waste_bins(id) ON DELETE CASCADE,
  points_earned integer NOT NULL,
  waste_type waste_type NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  points_reward integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  correct_answer text NOT NULL,
  wrong_answer_1 text NOT NULL,
  wrong_answer_2 text NOT NULL,
  wrong_answer_3 text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_completions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  points_earned integer NOT NULL,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, quiz_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_waste_bins_station ON public.waste_bins(station_id);
CREATE INDEX IF NOT EXISTS idx_waste_bins_qr ON public.waste_bins(qr_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bin ON public.transactions(bin_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user ON public.quiz_completions(user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waste_stations_updated_at ON public.waste_stations;
CREATE TRIGGER update_waste_stations_updated_at
  BEFORE UPDATE ON public.waste_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waste_bins_updated_at ON public.waste_bins;
CREATE TRIGGER update_waste_bins_updated_at
  BEFORE UPDATE ON public.waste_bins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.waste_stations (id, name, location, description) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Estación Principal', 'Edificio A - Planta Baja', 'Estación principal cerca de la cafetería'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Estación Biblioteca', 'Biblioteca - Segundo Piso', 'Estación ubicada en la entrada de la biblioteca'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Estación Deportiva', 'Gimnasio - Área Exterior', 'Estación cerca de las canchas deportivas')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.waste_bins (station_id, waste_type, capacity_percentage, qr_code) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 45, 'QR-MAIN-REC-001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'non_recyclable', 60, 'QR-MAIN-NON-001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'organic', 30, 'QR-MAIN-ORG-001'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'recyclable', 85, 'QR-LIB-REC-001'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'non_recyclable', 70, 'QR-LIB-NON-001'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'organic', 50, 'QR-LIB-ORG-001'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'recyclable', 55, 'QR-SPORT-REC-001'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'non_recyclable', 90, 'QR-SPORT-NON-001'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'organic', 40, 'QR-SPORT-ORG-001')
ON CONFLICT DO NOTHING;

INSERT INTO public.products (name, description, points_cost, category, stock, image_url) VALUES
  ('Cuaderno Ecológico', 'Cuaderno de 100 hojas recicladas', 50, 'Papelería', 100, '/placeholder.svg'),
  ('Lápices de Colores', 'Set de 12 lápices de colores', 30, 'Papelería', 150, '/placeholder.svg'),
  ('Mochila Reciclada', 'Mochila hecha con materiales reciclados', 200, 'Accesorios', 50, '/placeholder.svg'),
  ('Botella Reutilizable', 'Botella de acero inoxidable 500ml', 80, 'Accesorios', 80, '/placeholder.svg'),
  ('Libro de Ecología', 'Guía práctica de sostenibilidad', 120, 'Libros', 60, '/placeholder.svg'),
  ('Calculadora Solar', 'Calculadora científica con panel solar', 100, 'Tecnología', 70, '/placeholder.svg')
ON CONFLICT DO NOTHING;

INSERT INTO public.news_articles (title, content, published) VALUES
  ('¡Bienvenido a EcoLoop!', 'EcoLoop es tu nueva plataforma para contribuir al medio ambiente mientras ganas recompensas.', true),
  ('Consejos para Reciclar Correctamente', 'Aprende a separar tus residuos: Reciclables, No reciclables, Orgánicos.', true),
  ('Nuevo Sistema de Puntos', 'Ahora puedes ganar más puntos completando quizzes sobre medio ambiente.', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.quizzes (id, title, description, points_reward, is_active) VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Conocimientos Básicos de Reciclaje', 'Pon a prueba tus conocimientos sobre reciclaje', 15, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, order_index) VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Qué tipo de residuo es una botella de plástico?', 'Reciclable', 'Orgánico', 'No reciclable', 'Peligroso', 1),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Dónde se deben depositar las cáscaras de frutas?', 'Orgánico', 'Reciclable', 'No reciclable', 'Vidrio', 2),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '¿Cuánto tiempo tarda en degradarse una botella de plástico?', '450 años', '10 años', '1 año', '100 años', 3)
ON CONFLICT DO NOTHING;

-- Admin user de prueba
INSERT INTO public.profiles (email, full_name, role, eco_points) VALUES
  ('admin@ecoloop.com', 'Administrador EcoLoop', 'admin', 0),
  ('worker@ecoloop.com', 'Operario EcoLoop', 'worker', 0),
  ('user@ecoloop.com', 'Usuario de Prueba', 'user', 150)
ON CONFLICT DO NOTHING;
