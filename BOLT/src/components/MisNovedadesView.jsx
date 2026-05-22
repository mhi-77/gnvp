import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * MisNovedadesView - Vista principal para el trabajador.
 *
 * Muestra el resumen de novedades del período activo y permite
 * cargar nuevas novedades. Es la vista de entrada para el rol TRABAJADOR.
 * Roles con acceso: todos (usuario_tipo <= 5).
 */
export default function MisNovedadesView() {
  const { user } = useAuth();
  const [novedades, setNovedades] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Obtener el período activo
      const { data: periodoData, error: periodoError } = await supabase
        .from('gn_periodos')
        .select('*')
        .eq('estado', 'abierto')
        .order('anio', { ascending: false })
        .order('mes', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (periodoError) throw periodoError;
      setPeriodo(periodoData);

      if (!periodoData) { setIsLoading(false); return; }

      // Obtener las novedades del usuario en el período activo
      const { data: novedadesData, error: novedadesError } = await supabase
        .from('gn_novedades')
        .select(`
          id, fecha_inicio, fecha_fin, cantidad, detalle, estado, cargado_at,
          gn_categorias_novedad(nombre, unidad)
        `)
        .eq('cargado_por', user.id)
        .eq('periodo_id', periodoData.id)
        .order('cargado_at', { ascending: false });

      if (novedadesError) throw novedadesError;
      setNovedades(novedadesData || []);
    } catch (err) {
      console.error('Error cargando novedades:', err);
      setError('Error al cargar las novedades. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para el badge de estado
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Aprobada
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rechazada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Encabezado con período activo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis Novedades</h2>
          {periodo ? (
            <p className="text-sm text-gray-500 mt-0.5">Período: <span className="font-medium text-sky-700">{periodo.nombre}</span></p>
          ) : (
            <p className="text-sm text-amber-600 mt-0.5">No hay período abierto actualmente</p>
          )}
        </div>
        {periodo && (
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            onClick={() => {/* TODO: abrir modal de carga */}}
          >
            <Plus className="w-4 h-4" />
            Nueva novedad
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Lista de novedades */}
      {novedades.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tenés novedades cargadas</p>
          {periodo && (
            <p className="text-sm text-gray-400 mt-1">Usá el botón "Nueva novedad" para cargar una</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {novedades.map((novedad) => (
            <div
              key={novedad.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {novedad.gn_categorias_novedad?.nombre || 'Categoría'}
                  </span>
                  {getEstadoBadge(novedad.estado)}
                </div>
                <p className="text-xs text-gray-500">
                  {novedad.fecha_inicio}
                  {novedad.fecha_fin && novedad.fecha_fin !== novedad.fecha_inicio
                    ? ` al ${novedad.fecha_fin}`
                    : ''}
                  {novedad.cantidad > 0 && (
                    <span> · {novedad.cantidad} {novedad.gn_categorias_novedad?.unidad || ''}</span>
                  )}
                </p>
                {novedad.detalle && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{novedad.detalle}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-3 mt-1" />
            </div>
          ))}
        </div>
      )}

      {/* Resumen de estado */}
      {novedades.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pendientes', estado: 'pendiente', color: 'yellow' },
            { label: 'Aprobadas', estado: 'aprobada', color: 'green' },
            { label: 'Rechazadas', estado: 'rechazada', color: 'red' },
          ].map(({ label, estado, color }) => {
            const count = novedades.filter(n => n.estado === estado).length;
            return (
              <div key={estado} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
                <p className={`text-xs text-${color}-600 mt-0.5`}>{label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
