import React, { useState, useEffect } from 'react';
import { BarChart2, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * ReportesView - Vista de reportes estadísticos.
 *
 * Muestra resúmenes de novedades por período, categoría y trabajador.
 * Permite exportar a Excel. Acceso: usuario_tipo <= 3 (JEFE, LIQUIDACIONES, SUPERUSUARIO).
 */
export default function ReportesView() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [resumen, setResumen] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) fetchResumen();
  }, [selectedPeriodo]);

  const fetchPeriodos = async () => {
    const { data } = await supabase
      .from('gn_periodos')
      .select('id, nombre, estado')
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });
    setPeriodos(data || []);
    if (data?.length > 0) setSelectedPeriodo(String(data[0].id));
  };

  const fetchResumen = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('gn_novedades')
        .select(`
          estado,
          gn_categorias_novedad(nombre),
          gn_trabajadores(apellido, nombre, legajo)
        `)
        .eq('periodo_id', selectedPeriodo);
      setResumen(data || []);
    } catch (err) {
      console.error('Error cargando resumen:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPorEstado = (estado) => resumen.filter(n => n.estado === estado).length;
  const totalPorCategoria = () => {
    const counts = {};
    resumen.forEach(n => {
      const nombre = n.gn_categorias_novedad?.nombre || 'Sin categoría';
      counts[nombre] = (counts[nombre] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reportes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Resumen estadístico por período</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Selector de período */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Período</label>
        <select
          value={selectedPeriodo}
          onChange={e => setSelectedPeriodo(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-700 w-full sm:w-auto"
        >
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.estado})</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: resumen.length, color: 'sky' },
              { label: 'Pendientes', value: totalPorEstado('pendiente'), color: 'yellow' },
              { label: 'Aprobadas', value: totalPorEstado('aprobada'), color: 'green' },
              { label: 'Rechazadas', value: totalPorEstado('rechazada'), color: 'red' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-center`}>
                <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
                <p className={`text-xs text-${color}-600 mt-1`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Novedades por categoría */}
          {totalPorCategoria().length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-gray-900">Novedades por categoría</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {totalPorCategoria().map(([nombre, count]) => (
                  <div key={nombre} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-700">{nombre}</span>
                    <span className="text-sm font-semibold text-sky-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resumen.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay novedades en este período</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
