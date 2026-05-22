import React, { useState } from 'react';
import { UserCog, Mail, Hash, Building2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * PerfilView - Vista del perfil del usuario autenticado.
 *
 * Muestra los datos del usuario y permite editar la información personal.
 * Acceso: usuario_tipo <= 4 (TRABAJADOR, COORDINADOR, JEFE, LIQUIDACIONES).
 */
export default function PerfilView() {
  const { user, refreshUserProfile } = useAuth();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ full_name: user?.name || '', legajo: user?.legajo || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('gn_profiles')
        .update({ full_name: form.full_name, legajo: form.legajo, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshUserProfile();
      setSuccess(true);
      setEditando(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const campos = [
    { icon: UserCog, label: 'Nombre completo', value: user?.name, key: 'full_name' },
    { icon: Mail, label: 'Email', value: user?.email, readonly: true },
    { icon: Hash, label: 'Legajo', value: user?.legajo || '—', key: 'legajo' },
    { icon: Shield, label: 'Rol', value: user?.roleDescription, readonly: true },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="text-sm text-gray-500 mt-0.5">Información de tu cuenta</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          Perfil actualizado correctamente.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-sky-700 rounded-2xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-sky-700 font-medium">{user?.roleDescription}</p>
        </div>
      </div>

      {/* Campos del perfil */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {campos.map(({ icon: Icon, label, value, key, readonly }) => (
          <div key={label} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              {editando && !readonly && key ? (
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-sm text-gray-900 border-b border-sky-400 focus:outline-none py-0.5 bg-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900 truncate">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {!editando ? (
        <button
          onClick={() => setEditando(true)}
          className="w-full py-2.5 border border-sky-600 text-sky-700 rounded-lg hover:bg-sky-50 transition-colors text-sm font-medium"
        >
          Editar perfil
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => { setEditando(false); setError(''); }}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  );
}
