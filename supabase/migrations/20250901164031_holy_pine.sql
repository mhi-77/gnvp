/*
  # Corregir relación entre padron y profiles

  1. Verificaciones y correcciones
    - Verificar que la columna voto_pick_user existe en padron
    - Crear la clave foránea entre padron.voto_pick_user y profiles.id
    - Asegurar que la relación esté correctamente establecida

  2. Seguridad
    - Mantener las políticas RLS existentes
    - No afectar datos existentes
*/

-- Verificar si la columna voto_pick_user existe, si no, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'padron' AND column_name = 'voto_pick_user'
  ) THEN
    ALTER TABLE padron ADD COLUMN voto_pick_user uuid;
  END IF;
END $$;

-- Verificar si la columna voto_pick_at existe, si no, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'padron' AND column_name = 'voto_pick_at'
  ) THEN
    ALTER TABLE padron ADD COLUMN voto_pick_at timestamptz;
  END IF;
END $$;

-- Eliminar la clave foránea existente si existe (para recrearla correctamente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'padron_voto_pick_user_fkey'
    AND table_name = 'padron'
  ) THEN
    ALTER TABLE padron DROP CONSTRAINT padron_voto_pick_user_fkey;
  END IF;
END $$;

-- Crear la clave foránea entre padron.voto_pick_user y profiles.id
ALTER TABLE padron 
ADD CONSTRAINT padron_voto_pick_user_fkey 
FOREIGN KEY (voto_pick_user) REFERENCES profiles(id);

-- Verificar que la tabla users existe y tiene la relación correcta con profiles
-- (Esta debería existir por defecto en Supabase Auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    -- Si no existe la relación profiles -> users, crearla
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;