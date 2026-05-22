import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * PeriodosView - Gestión de períodos de liquidación.
 *
 * Permite crear nuevos períodos y cambiar su estado (abierto/cerrado/procesado).
 * Acceso: usuario_tipo <= 2 (LIQUIDACIONES, SUPERUSUARIO).
 */
export default function PeriodosView() {
  const [periodos, setPeriodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('gn_periodos')
      .select('*')
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });
    setPeriodos(data || []);
    setIsLoading(false);
  };

  const handleCrear = async () => {
    setSaving(true);
    setError('');
    try {
      const nombre = `${meses[form.mes - 1]} ${form.anio}`;
      const { error } = await supabase
        .from('gn_periodos')
        .insert([{ anio: form.anio, mes: form.mes, nombre, estado: 'abierto' }]);
      if (error) throw error;
      setShowForm(false);
      fetchPeriodos();
    } catch (err) {
      setError('Error al crear el período. Puede que ya exista.');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    await supabase.from('gn_periodos').update({ estado: nuevoEstado }).eq('id', id);
    fetchPeriodos();
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'abierto': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Abierto</span>;
      case 'cerrado': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Cerrado</span>;
      case 'procesado': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Procesado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Períodos de Liquidación</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de períodos mensuales</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo período
        </button>
      </div>

      {showForm && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Crear nuevo período</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={form.mes}
                onChange={e => setForm(f => ({ ...f, mes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
              <input
                type="number"
                value={form.anio}
                onChange={e => setForm(f => ({ ...f, anio: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                min={2020} max={2099}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button
              onClick={handleCrear}
              disabled={saving}
              className="px-4 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : periodos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay períodos creados</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {periodos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                  {getEstadoBadge(p.estado)}
                </div>
                <div className="flex items-center gap-2">
                  {p.estado === 'abierto' && (
                    <button
                      onClick={() => handleCambiarEstado(p.id, 'cerrado')}
                      title="Cerrar período"
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                  {p.estado === 'cerrado' && (
                    <button
                      onClick={() => handleCambiarEstado(p.id, 'abierto')}
                      title="Reabrir período"
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
