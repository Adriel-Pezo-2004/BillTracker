'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// Spinner igual que en /inicio
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

export default function DashboardPage() {
  const [ingresos, setIngresos] = useState<Item[]>([]);
  const [gastos, setGastos] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Agrupar por tipo
  const ingresosPorTipo = groupBy(ingresos, i => i.tipo || 'Otros');
  const gastosPorTipo = groupBy(gastos, g => g.tipo || 'Otros');

  // Totales
  const totalIngresos = ingresos.reduce((sum, i) => sum + Number(i.monto ?? 0), 0);
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto ?? 0), 0);

  // Datos para gráficos
  const ingresosChartData = tipoIngresoOptions.map(tipo => ({
    tipo,
    monto: ingresosPorTipo[tipo]?.reduce((sum, i) => sum + Number(i.monto ?? 0), 0) || 0,
  }));

  const gastosChartData = tipoGastoOptions.map(tipo => ({
    tipo,
    monto: gastosPorTipo[tipo]?.reduce((sum, g) => sum + Number(g.monto ?? 0), 0) || 0,
  }));

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

      {/* RESUMEN */}
      <Card className="mb-6 shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-8">
          <div>
            <div className="text-muted-foreground">Total ingresos</div>
            <div className="text-2xl font-bold text-green-600">S/{totalIngresos.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total gastos</div>
            <div className="text-2xl font-bold text-red-600">S/{totalGastos.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance</div>
            <div className={`text-2xl font-bold ${totalIngresos - totalGastos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              S/{(totalIngresos - totalGastos).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INGRESOS */}
      <section>
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
                  {(
                    ingresosPorTipo[tipo]?.reduce(
                      (sum, i) => sum + Number(i.monto ?? 0),
                      0
                    ) || 0
                  ).toLocaleString()}
                </Badge>
              ))}
            </div>
            <div className="w-full h-72 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingresosChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip formatter={v => `S/${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="monto" fill="#22c55e" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
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
                  {ingresos
                    .slice()
                    .sort((a, b) => {
                      if (!a.createdAt) return 1;
                      if (!b.createdAt) return -1;
                      return b.createdAt.localeCompare(a.createdAt);
                    })
                    .map(i => (
                      <tr key={i.id} className="border-b last:border-none">
                        <td className="px-2 py-1">
                          {i.createdAt
                            ? format(new Date(i.createdAt), 'dd MMM yyyy', { locale: es })
                            : 'Sin fecha'}
                        </td>
                        <td className="px-2 py-1">{i.nombre ?? 'Sin nombre'}</td>
                        <td className="px-2 py-1">{i.tipo ?? 'Otros'}</td>
                        <td className="px-2 py-1 text-right text-green-700">
                          S/{Number(i.monto ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* GASTOS */}
      <section>
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
                  {(
                    gastosPorTipo[tipo]?.reduce(
                      (sum, g) => sum + Number(g.monto ?? 0),
                      0
                    ) || 0
                  ).toLocaleString()}
                </Badge>
              ))}
            </div>
            <div className="w-full h-72 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip formatter={v => `S/${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="monto" fill="#ef4444" name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
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
                  {gastos
                    .slice()
                    .sort((a, b) => {
                      if (!a.createdAt) return 1;
                      if (!b.createdAt) return -1;
                      return b.createdAt.localeCompare(a.createdAt);
                    })
                    .map(g => (
                      <tr key={g.id} className="border-b last:border-none">
                        <td className="px-2 py-1">
                          {g.createdAt
                            ? format(new Date(g.createdAt), 'dd MMM yyyy', { locale: es })
                            : 'Sin fecha'}
                        </td>
                        <td className="px-2 py-1">{g.nombre ?? 'Sin nombre'}</td>
                        <td className="px-2 py-1">{g.tipo ?? 'Otros'}</td>
                        <td className="px-2 py-1 text-right text-red-700">
                          S/{Number(g.monto ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}