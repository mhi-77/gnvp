import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * BandejaView - Bandeja de novedades para revisión.
 *
 * Permite a coordinadores y jefes ver y gestionar las novedades
 * pendientes de su sector. Muestra filtros por estado y período.
 * Roles con acceso: usuario_tipo <= 4 (COORDINADOR, JEFE, LIQUIDACIONES, SUPERUSUARIO).
 */
export default function BandejaView() {
  const { user } = useAuth();
  const [novedades, setNovedades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente');

  useEffect(() => {
    fetchNovedades();
  }, [filtroEstado]);

  const fetchNovedades = async () => {
    setIsLoading(true);
    setError('');
    try {
      let query = supabase
        .from('gn_novedades')
        .select(`
          id, fecha_inicio, fecha_fin, cantidad, detalle, estado, cargado_at,
          gn_categorias_novedad(nombre, unidad),
          gn_trabajadores(apellido, nombre, legajo),
          gn_periodos(nombre)
        `)
        .order('cargado_at', { ascending: false });

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setNovedades(data || []);
    } catch (err) {
      console.error('Error cargando bandeja:', err);
      setError('Error al cargar las novedades.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobada':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Aprobada</span>;
      case 'rechazada':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rechazada</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Pendiente</span>;
    }
  };

  const handleAprobar = async (id) => {
    try {
      const { error } = await supabase
        .from('gn_novedades')
        .update({ estado: 'aprobada', revisado_por: user.id, revisado_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      fetchNovedades();
    } catch (err) {
      console.error('Error al aprobar:', err);
    }
  };

  const handleRechazar = async (id) => {
    const motivo = window.prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return;
    try {
      const { error } = await supabase
        .from('gn_novedades')
        .update({
          estado: 'rechazada',
          rechazar_motivo: motivo || '',
          revisado_por: user.id,
          revisado_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      fetchNovedades();
    } catch (err) {
      console.error('Error al rechazar:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bandeja de Novedades</h2>
          <p className="text-sm text-gray-500 mt-0.5">Revisión y aprobación de novedades</p>
        </div>

        {/* Filtro de estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-700"
          >
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="todos">Todas</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : novedades.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay novedades {filtroEstado !== 'todos' ? filtroEstado + 's' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {novedades.map((novedad) => (
            <div key={novedad.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-200 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {novedad.gn_trabajadores?.apellido}, {novedad.gn_trabajadores?.nombre}
                    </span>
                    <span className="text-xs text-gray-400">Leg. {novedad.gn_trabajadores?.legajo}</span>
                    {getEstadoBadge(novedad.estado)}
                  </div>
                  <p className="text-sm text-gray-700">{novedad.gn_categorias_novedad?.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {novedad.fecha_inicio}
                    {novedad.fecha_fin && novedad.fecha_fin !== novedad.fecha_inicio ? ` al ${novedad.fecha_fin}` : ''}
                    {novedad.cantidad > 0 && ` · ${novedad.cantidad} ${novedad.gn_categorias_novedad?.unidad || ''}`}
                    {' · '}{novedad.gn_periodos?.nombre}
                  </p>
                  {novedad.detalle && (
                    <p className="text-xs text-gray-400 mt-1 italic">{novedad.detalle}</p>
                  )}
                </div>

                {/* Acciones: solo para pendientes */}
                {novedad.estado === 'pendiente' && user?.usuario_tipo <= 4 && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAprobar(novedad.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRechazar(novedad.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
