'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Spinner() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background z-50">
      <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
    </div>
  );
}

type Item = {
  id: string;
  nombre?: string | null;
  monto?: number | null;
  tipo?: string | null;
  createdAt?: string | null;
};

const tipoGastoOptions = [
  'Banco', 'Gasolina', 'Comisión ID', 'Gerita', 'Camila', 'Ximena',
  'Otros', 'IA', 'Comida', 'Ocio',
];

const tipoIngresoOptions = [
  'Mesada', 'Tareas', 'Desarrollo', 'Taxi', 'Otros',
];

function groupBy<T>(arr: T[], key: (item: T) => string) {
  return arr.reduce((acc, item) => {
    const group = key(item);
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

type FilterType = 'dia' | 'semana' | 'mes' | 'año' | 'rango';

function getYears(items: Item[]) {
  const years = new Set<number>();
  items.forEach(item => {
    if (item.createdAt) {
      years.add(new Date(item.createdAt).getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
}

function getContableMonth(date: Date) {
  // Si el día es menor o igual a 10, pertenece al mes anterior
  if (date.getDate() <= 10) {
    // Retrocede un mes
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 11);
    return { year: prevMonth.getFullYear(), month: prevMonth.getMonth() + 1 };
  }
  // Si es después del 10, pertenece al mes actual
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

// Componente Modal para mostrar todos los registros
function ModalRegistros({ 
  items, 
  title, 
  color, 
  isOpen, 
  onClose 
}: { 
  items: Item[], 
  title: string, 
  color: 'green' | 'red', 
  isOpen: boolean, 
  onClose: () => void 
}) {
  if (!isOpen) return null;

  const sortedItems = items
    .slice()
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className={`p-6 border-b ${color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                {title} ({sortedItems.length} registros)
              </h2>
              <Button variant="outline" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={color === 'green' ? 'bg-green-50' : 'bg-red-50'}>
                    <th className={`px-4 py-2 text-left ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                      Fecha
                    </th>
                    <th className={`px-4 py-2 text-left ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                      Nombre
                    </th>
                    <th className={`px-4 py-2 text-left ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                      Tipo
                    </th>
                    <th className={`px-4 py-2 text-right ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map(item => (
                    <tr key={item.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {item.createdAt
                          ? format(new Date(item.createdAt), 'dd MMM yyyy', { locale: es })
                          : 'Sin fecha'}
                      </td>
                      <td className="px-4 py-2">{item.nombre ?? 'Sin nombre'}</td>
                      <td className="px-4 py-2">{item.tipo ?? 'Otros'}</td>
                      <td className={`px-4 py-2 text-right font-medium ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                        S/{Number(item.monto ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DashboardPage() {
  const [ingresos, setIngresos] = useState<Item[]>([]);
  const [gastos, setGastos] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [gastoTipo, setGastoTipo] = useState<string>('');
  
  // Estados para modales
  const [modalIngresosOpen, setModalIngresosOpen] = useState(false);
  const [modalGastosOpen, setModalGastosOpen] = useState(false);
  
  // Filtros
  const [filterType, setFilterType] = useState<FilterType>('mes');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setIngresos(data.ingresos || []);
      setGastos(data.gastos || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Años disponibles para filtro de año
  const allYears = useMemo(() => {
    const years = [...getYears(ingresos), ...getYears(gastos)];
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [ingresos, gastos]);

  function toLocalDate(dateString: string) {
    const date = new Date(dateString);
    // Ajusta a UTC-5 (Perú)
    date.setHours(date.getHours() - (date.getTimezoneOffset() / 60) - 5);
    return date;
  }

  function filterByDate(items: Item[]) {
    return items.filter(item => {
      if (!item.createdAt) return false;
      const date = toLocalDate(item.createdAt);
      const now = new Date();

      switch (filterType) {
        case 'dia':
          if (!selectedDate) return true;
          const selected = new Date(selectedDate + 'T00:00:00-05:00');
          return isSameDay(date, selected);
        case 'semana':
          return isSameWeek(date, now, { weekStartsOn: 1 });
        case 'mes': {
          if (!selectedMonth) return true;
          const [year, month] = selectedMonth.split('-').map(Number);
          const contable = getContableMonth(date);
          return contable.year === year && contable.month === month;
        }
        case 'año': {
          if (!selectedYear) return true;
          const contable = getContableMonth(date);
          return contable.year === Number(selectedYear);
        }
        case 'rango':
          if (!rangeStart || !rangeEnd) return true;
          const start = new Date(rangeStart + 'T00:00:00-05:00');
          const end = new Date(rangeEnd + 'T23:59:59-05:00');
          return isWithinInterval(date, { start, end });
        default:
          return true;
      }
    });
  }

  // Filtrados
  const ingresosFiltrados = useMemo(() => filterByDate(ingresos), [ingresos, filterType, selectedDate, selectedMonth, selectedYear, rangeStart, rangeEnd]);
  
  // Filtro por tipo de gasto
  const gastosFiltrados = useMemo(() => {
    let filtrados = filterByDate(gastos);
    if (gastoTipo) {
      filtrados = filtrados.filter(g => g.tipo === gastoTipo);
    }
    return filtrados;
  }, [gastos, filterType, selectedDate, selectedMonth, selectedYear, rangeStart, rangeEnd, gastoTipo]);

  // Agrupar por tipo
  const ingresosPorTipo = groupBy(ingresosFiltrados, i => i.tipo || 'Otros');
  const gastosPorTipo = groupBy(gastosFiltrados, g => g.tipo || 'Otros');

  // Totales
  const totalIngresos = ingresosFiltrados.reduce((sum, i) => sum + Number(i.monto ?? 0), 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto ?? 0), 0);

  // Datos para gráficos
  const ingresosChartData = tipoIngresoOptions.map(tipo => ({
    tipo,
    monto: ingresosPorTipo[tipo]?.reduce((sum, i) => sum + Number(i.monto ?? 0), 0) || 0,
  }));

  const gastosChartData = tipoGastoOptions.map(tipo => ({
    tipo,
    monto: gastosPorTipo[tipo]?.reduce((sum, g) => sum + Number(g.monto ?? 0), 0) || 0,
  }));

  // Solo los últimos 5 registros para las tablas
  const ingresosMostrados = ingresosFiltrados
    .slice()
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  const gastosMostrados = gastosFiltrados
    .slice()
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard
      </motion.h1>

      {/* FILTRO DE FECHA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="mb-4 border border-gray-200">
          <CardContent className="flex flex-wrap gap-4 items-center py-4">
            <label className="font-semibold">Filtrar por:</label>
            <select
              className="border rounded px-2 py-1"
              value={filterType}
              onChange={e => setFilterType(e.target.value as FilterType)}
            >
              <option value="dia">Día</option>
              <option value="semana">Semana actual</option>
              <option value="mes">Mes</option>
              <option value="año">Año</option>
              <option value="rango">Rango</option>
            </select>
            {filterType === 'dia' && (
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            )}
            {filterType === 'mes' && (
              <input
                type="month"
                className="border rounded px-2 py-1"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              />
            )}
            {filterType === 'año' && (
              <select
                className="border rounded px-2 py-1"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
              >
                <option value="">Todos</option>
                {allYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            {filterType === 'rango' && (
              <>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                />
                <span>a</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                />
              </>
            )}
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => {
                setSelectedDate('');
                setSelectedMonth('');
                setSelectedYear('');
                setRangeStart('');
                setRangeEnd('');
              }}
            >
              Limpiar filtro
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* FILTRO POR TIPO DE GASTO */}
      <Card className="mb-2 border border-gray-200">
        <CardContent className="flex flex-wrap gap-4 items-center py-4">
          <label className="font-semibold">Tipo de gasto:</label>
          <select
            className="border rounded px-2 py-1"
            value={gastoTipo}
            onChange={e => setGastoTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {tipoGastoOptions.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* RESUMEN */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-8">
            <motion.div whileHover={{ scale: 1.05 }}>
              <div className="text-muted-foreground">Total ingresos</div>
              <div className="text-2xl font-bold text-green-600">S/{totalIngresos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <div className="text-muted-foreground">Total gastos</div>
              <div className="text-2xl font-bold text-red-600">S/{totalGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <div className="text-muted-foreground">Balance</div>
              <div className={`text-2xl font-bold ${totalIngresos - totalGastos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                S/{(totalIngresos - totalGastos).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* INGRESOS */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Ingresos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {tipoIngresoOptions.map(tipo => (
                <Badge
                  key={tipo}
                  variant="outline"
                  className="border-green-400 text-green-700 bg-green-50"
                >
                  {tipo}:{' '}
                  S/
                  {(ingresosPorTipo[tipo]?.reduce(
                    (sum, i) => sum + Number(i.monto ?? 0),
                    0
                  ) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
              ))}
            </div>
            <motion.div
              className="w-full h-72 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip formatter={v => `S/${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Legend />
                  <Bar dataKey="monto" fill="#22c55e" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            
            {/* Tabla con solo 5 registros */}
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-green-700">
                  Últimos {ingresosMostrados.length} ingresos
                </h3>
                {ingresosFiltrados.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalIngresosOpen(true)}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    Ver todos ({ingresosFiltrados.length})
                  </Button>
                )}
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-2 py-1 text-left text-green-700">Fecha</th>
                    <th className="px-2 py-1 text-left text-green-700">Nombre</th>
                    <th className="px-2 py-1 text-left text-green-700">Tipo</th>
                    <th className="px-2 py-1 text-right text-green-700">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresosMostrados.map(i => (
                    <tr key={i.id} className="border-b last:border-none">
                      <td className="px-2 py-1">
                        {i.createdAt
                          ? format(new Date(i.createdAt), 'dd MMM yyyy', { locale: es })
                          : 'Sin fecha'}
                      </td>
                      <td className="px-2 py-1">{i.nombre ?? 'Sin nombre'}</td>
                      <td className="px-2 py-1">{i.tipo ?? 'Otros'}</td>
                      <td className="px-2 py-1 text-right text-green-700">
                        S/{Number(i.monto ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* GASTOS */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Gastos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {tipoGastoOptions.map(tipo => (
                <Badge
                  key={tipo}
                  variant="outline"
                  className="border-red-400 text-red-700 bg-red-50"
                >
                  {tipo}:{' '}
                  S/
                  {(gastosPorTipo[tipo]?.reduce(
                    (sum, g) => sum + Number(g.monto ?? 0),
                    0
                  ) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
              ))}
            </div>
            <motion.div
              className="w-full h-72 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip formatter={v => `S/${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Legend />
                  <Bar dataKey="monto" fill="#ef4444" name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            
            {/* Tabla con solo 5 registros */}
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-red-700">
                  Últimos {gastosMostrados.length} gastos
                </h3>
                {gastosFiltrados.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalGastosOpen(true)}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    Ver todos ({gastosFiltrados.length})
                  </Button>
                )}
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-red-50">
                    <th className="px-2 py-1 text-left text-red-700">Fecha</th>
                    <th className="px-2 py-1 text-left text-red-700">Nombre</th>
                    <th className="px-2 py-1 text-left text-red-700">Tipo</th>
                    <th className="px-2 py-1 text-right text-red-700">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosMostrados.map(g => (
                    <tr key={g.id} className="border-b last:border-none">
                      <td className="px-2 py-1">
                        {g.createdAt
                          ? format(new Date(g.createdAt), 'dd MMM yyyy', { locale: es })
                          : 'Sin fecha'}
                      </td>
                      <td className="px-2 py-1">{g.nombre ?? 'Sin nombre'}</td>
                      <td className="px-2 py-1">{g.tipo ?? 'Otros'}</td>
                      <td className="px-2 py-1 text-right text-red-700">
                        S/{Number(g.monto ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* MODALES */}
      <ModalRegistros
        items={ingresosFiltrados}
        title="Todos los Ingresos"
        color="green"
        isOpen={modalIngresosOpen}
        onClose={() => setModalIngresosOpen(false)}
      />
      
      <ModalRegistros
        items={gastosFiltrados}
        title="Todos los Gastos"
        color="red"
        isOpen={modalGastosOpen}
        onClose={() => setModalGastosOpen(false)}
      />
    </div>
  );
}