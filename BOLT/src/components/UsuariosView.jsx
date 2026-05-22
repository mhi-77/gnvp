import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * UsuariosView - Gestión de usuarios del sistema.
 *
 * Permite ver y editar el rol/estado de los usuarios registrados.
 * La creación de usuarios se realiza invitándolos via Supabase Auth.
 * Acceso: usuario_tipo <= 2 (LIQUIDACIONES, SUPERUSUARIO).
 */
export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const ROLES = {
    1: 'SUPERUSUARIO',
    2: 'LIQUIDACIONES',
    3: 'JEFE',
    4: 'COORDINADOR',
    5: 'TRABAJADOR',
  };

  const ROLE_COLORS = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-sky-100 text-sky-700',
    3: 'bg-teal-100 text-teal-700',
    4: 'bg-yellow-100 text-yellow-700',
    5: 'bg-gray-100 text-gray-700',
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('gn_profiles')
        .select('id, full_name, email, legajo, usuario_tipo, activo, gn_sectores(nombre)')
        .order('usuario_tipo')
        .order('full_name');
      if (fetchError) throw fetchError;
      setUsuarios(data || []);
    } catch (err) {
      setError('Error al cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarTipo = async (id, nuevoTipo) => {
    const { error } = await supabase
      .from('gn_profiles')
      .update({ usuario_tipo: parseInt(nuevoTipo) })
      .eq('id', id);
    if (!error) fetchUsuarios();
  };

  const handleToggleActivo = async (id, activo) => {
    await supabase.from('gn_profiles').update({ activo: !activo }).eq('id', id);
    fetchUsuarios();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium text-sm opacity-60 cursor-not-allowed"
          title="Función próximamente disponible"
          disabled
        >
          <UserPlus className="w-4 h-4" />
          Invitar usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-sky-700" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${u.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {u.full_name || u.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {u.email}
                      {u.legajo && ` · Leg. ${u.legajo}`}
                      {u.gn_sectores?.nombre && ` · ${u.gn_sectores.nombre}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Badge de rol */}
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.usuario_tipo] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLES[u.usuario_tipo] || 'Desconocido'}
                  </span>
                  {/* Selector de rol */}
                  <select
                    value={u.usuario_tipo}
                    onChange={e => handleCambiarTipo(u.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-700"
                  >
                    {Object.entries(ROLES).map(([tipo, desc]) => (
                      <option key={tipo} value={tipo}>{desc}</option>
                    ))}
                  </select>
                  {/* Activar/desactivar */}
                  <button
                    onClick={() => handleToggleActivo(u.id, u.activo)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.activo ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : 'bg-red-50 text-red-700 hover:bg-green-50 hover:text-green-700'}`}
                  >
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
