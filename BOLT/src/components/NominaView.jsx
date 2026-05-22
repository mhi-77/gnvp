import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Search, Users, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

/**
 * NominaView - Gestión de la nómina de trabajadores.
 *
 * Permite importar trabajadores desde Excel y ver/editar la nómina.
 * Acceso: usuario_tipo <= 2 (LIQUIDACIONES, SUPERUSUARIO).
 */
export default function NominaView() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchTrabajadores();
  }, []);

  const fetchTrabajadores = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('gn_trabajadores')
        .select('id, legajo, apellido, nombre, cargo, activo, gn_sectores(nombre)')
        .order('apellido')
        .order('nombre');
      if (fetchError) throw fetchError;
      setTrabajadores(data || []);
    } catch (err) {
      setError('Error al cargar la nómina.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    setImportResult(null);
    setError('');

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // Mapear columnas del Excel a campos de la tabla
      // Se esperan columnas: LEGAJO, APELLIDO, NOMBRE, DNI, CARGO, SECTOR
      const trabajadoresParaImportar = rows
        .filter(row => row.LEGAJO || row.legajo)
        .map(row => ({
          legajo: String(row.LEGAJO || row.legajo || '').trim(),
          apellido: String(row.APELLIDO || row.apellido || '').trim().toUpperCase(),
          nombre: String(row.NOMBRE || row.nombre || '').trim().toUpperCase(),
          dni: parseInt(row.DNI || row.dni) || null,
          cargo: String(row.CARGO || row.cargo || '').trim(),
          activo: true,
        })).filter(t => t.legajo && t.apellido && t.nombre);

      if (trabajadoresParaImportar.length === 0) {
        setError('No se encontraron filas válidas. Verificá que el Excel tenga columnas: LEGAJO, APELLIDO, NOMBRE.');
        setImportando(false);
        return;
      }

      // Upsert: actualiza si el legajo ya existe, inserta si no
      const { data, error: upsertError } = await supabase
        .from('gn_trabajadores')
        .upsert(trabajadoresParaImportar, { onConflict: 'legajo' })
        .select('id');

      if (upsertError) throw upsertError;

      setImportResult({ total: trabajadoresParaImportar.length, procesados: data?.length || 0 });
      fetchTrabajadores();
    } catch (err) {
      console.error('Error importando:', err);
      setError('Error al importar el archivo. Verificá el formato.');
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  };

  const filtrados = trabajadores.filter(t =>
    `${t.apellido} ${t.nombre} ${t.legajo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nómina</h2>
          <p className="text-sm text-gray-500 mt-0.5">{trabajadores.length} trabajadores registrados</p>
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${importando ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-sky-700 text-white hover:bg-sky-800'}`}>
          <Upload className="w-4 h-4" />
          {importando ? 'Importando...' : 'Importar Excel'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            disabled={importando}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {importResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">
          Importación exitosa: {importResult.procesados} de {importResult.total} trabajadores procesados.
        </div>
      )}

      {/* Formato esperado */}
      <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-700">
        <strong>Formato del Excel:</strong> columnas requeridas: <code>LEGAJO</code>, <code>APELLIDO</code>, <code>NOMBRE</code>. Opcionales: <code>DNI</code>, <code>CARGO</code>.
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por apellido, nombre o legajo..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{busqueda ? 'Sin resultados para la búsqueda' : 'No hay trabajadores en la nómina'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtrados.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.apellido}, {t.nombre}</p>
                  <p className="text-xs text-gray-500">
                    Leg. {t.legajo}
                    {t.cargo && ` · ${t.cargo}`}
                    {t.gn_sectores?.nombre && ` · ${t.gn_sectores.nombre}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!t.activo && (
                    <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Inactivo</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
