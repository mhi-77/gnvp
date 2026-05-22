import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthContext - Contexto global de autenticación para GINOVA.
 *
 * Gestiona el ciclo de vida de la sesión del usuario:
 * - Login con email y contraseña via Supabase Auth
 * - Carga del perfil desde gn_profiles
 * - Obtención del rol desde gn_usuariost
 * - Logout con limpieza de estado
 * - Refresco manual del perfil
 *
 * El objeto user expuesto contiene:
 * - id: UUID de Supabase Auth
 * - email
 * - name: full_name del perfil
 * - legajo: número de legajo del trabajador
 * - sector_id: sector asignado
 * - usuario_tipo: 1=SUPERUSUARIO, 2=LIQUIDACIONES, 3=JEFE, 4=COORDINADOR, 5=TRABAJADOR
 * - roleDescription: descripción legible del rol
 * - activo: si el usuario está habilitado
 */

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Cargar perfil del usuario desde gn_profiles
        const { data: profile } = await supabase
          .from('gn_profiles')
          .select('full_name, legajo, sector_id, usuario_tipo, informacion, activo')
          .eq('id', data.user.id)
          .maybeSingle();

        // Obtener descripción del rol desde gn_usuariost
        const { data: userType } = await supabase
          .from('gn_usuariost')
          .select('descripcion')
          .eq('tipo', profile?.usuario_tipo || 5)
          .maybeSingle();

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.full_name || data.user.email?.split('@')[0] || 'Usuario',
          legajo: profile?.legajo,
          sector_id: profile?.sector_id,
          informacion: profile?.informacion,
          usuario_tipo: profile?.usuario_tipo || 5,
          roleDescription: userType?.descripcion || 'TRABAJADOR',
          activo: profile?.activo ?? true,
        });

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Error durante login:', error);
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return false;

      const { data: profile } = await supabase
        .from('gn_profiles')
        .select('full_name, legajo, sector_id, usuario_tipo, informacion, activo')
        .eq('id', authUser.id)
        .maybeSingle();

      const { data: userType } = await supabase
        .from('gn_usuariost')
        .select('descripcion')
        .eq('tipo', profile?.usuario_tipo || 5)
        .maybeSingle();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.full_name || authUser.email?.split('@')[0] || 'Usuario',
        legajo: profile?.legajo,
        sector_id: profile?.sector_id,
        informacion: profile?.informacion,
        usuario_tipo: profile?.usuario_tipo || 5,
        roleDescription: userType?.descripcion || 'TRABAJADOR',
        activo: profile?.activo ?? true,
      });

      return true;
    } catch (error) {
      console.error('Error al refrescar perfil:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
