import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * CategoriasView - ABM de categorías de novedad.
 *
 * Permite crear, editar y activar/desactivar los tipos de novedades
 * disponibles para los trabajadores.
 * Acceso: usuario_tipo <= 2 (LIQUIDACIONES, SUPERUSUARIO).
 */
export default function CategoriasView() {
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', unidad: 'horas', requiere_detalle: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('gn_categorias_novedad')
      .select('*')
      .order('nombre');
    setCategorias(data || []);
    setIsLoading(false);
  };

  const handleEdit = (cat) => {
    setEditando(cat.id);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion, unidad: cat.unidad, requiere_detalle: cat.requiere_detalle });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditando(null);
    setForm({ nombre: '', descripcion: '', unidad: 'horas', requiere_detalle: false });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editando) {
        const { error } = await supabase
          .from('gn_categorias_novedad')
          .update({ nombre: form.nombre, descripcion: form.descripcion, unidad: form.unidad, requiere_detalle: form.requiere_detalle })
          .eq('id', editando);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gn_categorias_novedad')
          .insert([{ nombre: form.nombre, descripcion: form.descripcion, unidad: form.unidad, requiere_detalle: form.requiere_detalle }]);
        if (error) throw error;
      }
      setShowForm(false);
      fetchCategorias();
    } catch (err) {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiva = async (cat) => {
    await supabase
      .from('gn_categorias_novedad')
      .update({ activa: !cat.activa })
      .eq('id', cat.id);
    fetchCategorias();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categorías de Novedad</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tipos de novedades disponibles para los trabajadores</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">{editando ? 'Editar categoría' : 'Nueva categoría'}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                placeholder="Ej: Horas extras, Guardia, Prestación..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unidad de medida</label>
              <select
                value={form.unidad}
                onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="horas">Horas</option>
                <option value="dias">Días</option>
                <option value="cantidad">Cantidad</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              placeholder="Descripción breve de la categoría"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requiere_detalle}
              onChange={e => setForm(f => ({ ...f, requiere_detalle: e.target.checked }))}
              className="w-4 h-4 text-sky-700 rounded"
            />
            <span className="text-sm text-gray-700">Requiere detalle obligatorio al cargar</span>
          </label>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay categorías definidas aún</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {categorias.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${cat.activa ? 'text-gray-900' : 'text-gray-400'}`}>{cat.nombre}</p>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{cat.unidad}</span>
                    {cat.requiere_detalle && <span className="text-xs px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded">detalle requerido</span>}
                  </div>
                  {cat.descripcion && <p className="text-xs text-gray-400 mt-0.5">{cat.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-400 hover:text-sky-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActiva(cat)}
                    className={`p-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${cat.activa ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}`}
                    title={cat.activa ? 'Desactivar' : 'Activar'}
                  >
                    {cat.activa ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
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
