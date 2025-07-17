'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

function getUserIdFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Modal para mostrar todos los registros
function ModalTodosLosRegistros({ 
  items, 
  title, 
  color, 
  isOpen, 
  onClose,
  onEdit,
  onDelete
}: { 
  items: any[], 
  title: string, 
  color: 'green' | 'red' | 'blue', 
  isOpen: boolean, 
  onClose: () => void,
  onEdit: (item: any) => void,
  onDelete: (id: string) => void
}) {
  if (!isOpen) return null;

  const sortedItems = items
    .slice()
    .sort((a, b) => {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
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
          <div className={`p-6 border-b ${
            color === 'green' ? 'bg-green-50' : 
            color === 'red' ? 'bg-red-50' : 
            'bg-blue-50'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${
                color === 'green' ? 'text-green-700' : 
                color === 'red' ? 'text-red-700' : 
                'text-blue-700'
              }`}>
                {title} ({sortedItems.length} registros)
              </h2>
              <Button variant="outline" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-3">
              {sortedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{item.nombre}</div>
                    <div className="text-sm text-gray-500">
                      {item.fecha
                        ? format(new Date(item.fecha), 'dd MMM yyyy', { locale: es })
                        : 'Sin fecha'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tipo: {item.tipo || 'Sin tipo'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${
                      color === 'green' ? 'text-green-700' : 
                      color === 'red' ? 'text-red-700' : 
                      'text-blue-700'
                    }`}>
                      {color === 'green' ? '+' : '-'}S/{Number(item.ingresos || item.gasto || 0).toFixed(2)}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => onEdit(item)}
                      >
                        <span className="sr-only">Editar</span>
                        <svg width="18" height="18" fill="none" stroke="currentColor">
                          <path d="M15.232 5.232l-2.464-2.464a2 2 0 00-2.828 0l-6.536 6.536a2 2 0 000 2.828l2.464 2.464a2 2 0 002.828 0l6.536-6.536a2 2 0 000-2.828z" />
                        </svg>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => onDelete(item.id)}
                      >
                        <span className="sr-only">Eliminar</span>
                        <svg width="18" height="18" fill="none" stroke="currentColor">
                          <path d="M6 6l6 6M6 12L12 6" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Formulario para crear o editar items
function ItemForm({ open, onOpenChange, onSubmit, initial, type }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSubmit: (data: { nombre: string, monto: number, tipo: string }) => Promise<void>,
  initial?: { nombre: string, monto: number, tipo: string },
  type: 'ingreso' | 'gasto' | 'tarjeta'
}) {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [monto, setMonto] = useState(initial?.monto?.toString() || '');
  const [loading, setLoading] = useState(false);

  const tipoOptions =
    type === 'gasto'
      ? ['Banco', 'Gasolina', 'Comisión ID', 'Gerita', 'Camila', 'Ximena', 'Otros', 'IA', 'Comida', 'Ocio']
      : type === 'tarjeta'
      ? ['Banco', 'Gasolina', 'Comisión ID', 'Gerita', 'Camila', 'Ximena', 'Otros', 'IA', 'Comida', 'Ocio']
      : ['Mesada', 'Tareas', 'Desarrollo', 'Taxi', 'Otros'];

  const [tipo, setTipo] = useState(initial?.tipo || tipoOptions[0]);

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setMonto(initial?.monto?.toString() || '');
    setTipo(initial?.tipo || tipoOptions[0]);
  }, [initial, open]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle>
                  {initial
                    ? `Editar ${type === 'ingreso' ? 'Ingreso' : type === 'gasto' ? 'Gasto' : 'Gasto de Tarjeta'}`
                    : `Nuevo ${type === 'ingreso' ? 'Ingreso' : type === 'gasto' ? 'Gasto' : 'Gasto de Tarjeta'}`}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setLoading(true);
                  await onSubmit({ nombre, monto: Number(monto), tipo });
                  setLoading(false);
                  onOpenChange(false);
                }}
                className="space-y-4"
              >
                <div className="flex flex-col gap-2 py-2">
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2 py-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    required
                    min={0}
                    step="any"
                  />
                </div>
                <div className="flex flex-col gap-2 py-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {initial ? 'Guardar cambios' : 'Crear'}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancelar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

export default function Dashboard() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [tarjetaCredito, setTarjetaCredito] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [openIngreso, setOpenIngreso] = useState(false);
  const [openGasto, setOpenGasto] = useState(false);
  const [openTarjeta, setOpenTarjeta] = useState(false);
  const [editIngreso, setEditIngreso] = useState<{ id: string, nombre: string, monto: number, tipo: string } | null>(null);
  const [editGasto, setEditGasto] = useState<{ id: string, nombre: string, monto: number, tipo: string } | null>(null);
  const [editTarjeta, setEditTarjeta] = useState<{ id: string, nombre: string, monto: number, tipo: string } | null>(null);
  
  // Modales para ver todos
  const [modalIngresosOpen, setModalIngresosOpen] = useState(false);
  const [modalGastosOpen, setModalGastosOpen] = useState(false);
  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ingresosRes, gastosRes, tarjetaRes] = await Promise.all([
        fetch('/api/ingresos'),
        fetch('/api/gastos'),
        fetch('/api/tarjeta-credito')
      ]);
      
      setIngresos(await ingresosRes.json());
      setGastos(await gastosRes.json());
      setTarjetaCredito(await tarjetaRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }

  // Totales
  const totalIngresos = useMemo(
    () => ingresos.reduce((acc, curr) => acc + (curr.ingresos || 0), 0),
    [ingresos]
  );
  const totalGastos = useMemo(
    () => gastos.reduce((acc, curr) => acc + (curr.gasto || 0), 0),
    [gastos]
  );
  const totalTarjeta = useMemo(
    () => tarjetaCredito.reduce((acc, curr) => acc + (curr.gasto || 0), 0),
    [tarjetaCredito]
  );
  const saldoAhorros = totalIngresos - totalGastos;

  // Mostrar solo 5 registros más recientes
  const ingresosMostrados = ingresos
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  const gastosMostrados = gastos
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  const tarjetaMostrados = tarjetaCredito
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  // CRUD functions para tarjeta de crédito
  async function handleCreateTarjeta(data: { nombre: string, monto: number, tipo: string }) {
    await fetch('/api/tarjeta-credito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, gasto: data.monto, tipo: data.tipo }),
    });
    await fetchData();
  }

  async function handleEditTarjeta(data: { nombre: string, monto: number, tipo: string }) {
    if (!editTarjeta) return;
    await fetch(`/api/tarjeta-credito/${editTarjeta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, gasto: data.monto, tipo: data.tipo }),
    });
    setEditTarjeta(null);
    await fetchData();
  }

  async function handleDeleteTarjeta(id: string) {
    await fetch(`/api/tarjeta-credito/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  // CRUD functions existentes para ingresos y gastos...
  async function handleCreateIngreso(data: { nombre: string, monto: number, tipo: string }) {
    await fetch('/api/ingresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, ingresos: data.monto, tipo: data.tipo }),
    });
    await fetchData();
  }

  async function handleEditIngreso(data: { nombre: string, monto: number, tipo: string }) {
    if (!editIngreso) return;
    await fetch(`/api/ingresos/${editIngreso.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, ingresos: data.monto, tipo: data.tipo }),
    });
    setEditIngreso(null);
    await fetchData();
  }

  async function handleDeleteIngreso(id: string) {
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  async function handleCreateGasto(data: { nombre: string, monto: number, tipo: string }) {
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, gasto: data.monto, tipo: data.tipo }),
    });
    await fetchData();
  }

  async function handleEditGasto(data: { nombre: string, monto: number, tipo: string }) {
    if (!editGasto) return;
    await fetch(`/api/gastos/${editGasto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, gasto: data.monto, tipo: data.tipo }),
    });
    setEditGasto(null);
    await fetchData();
  }

  async function handleDeleteGasto(id: string) {
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-background">
       <main className="max-w-6xl mx-auto py-10 px-4 flex flex-col gap-8">
        {/* Card principal con dos secciones */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="w-full bg-primary text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Resumen Financiero</CardTitle>
              <CardDescription className="text-center text-primary-foreground/80">
                Tu estado financiero actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Saldo de Ahorros */}
                <motion.div
                  className="text-center"
                  initial={false}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ transition: 'transform 0.2s' }}
                >
                  <h3 className="text-lg font-medium mb-2 text-primary-foreground/90">
                    Saldo de Ahorros
                  </h3>
                  <p className="text-sm text-primary-foreground/70 mb-2">
                    Ingresos - Gastos
                  </p>
                  <div className={`text-3xl font-bold ${
                    saldoAhorros >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                    S/{saldoAhorros.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </motion.div>

                {/* Total Tarjeta de Crédito */}
                <motion.div
                  className="text-center"
                  initial={false}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ transition: 'transform 0.2s' }}
                >
                  <h3 className="text-lg font-medium mb-2 text-primary-foreground/90">
                    Deuda de Tarjeta
                  </h3>
                  <p className="text-sm text-primary-foreground/70 mb-2">
                    Total gastado con tarjeta
                  </p>
                  <div className="text-3xl font-bold text-orange-200">
                    -S/{totalTarjeta.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Balance neto (opcional - puedes quitarlo si no lo quieres) */}
              <div className="mt-6 pt-4 border-t border-primary-foreground/20">
                <motion.div
                  className="text-center"
                  initial={false}
                  whileHover={{ scale: 1.02 }}
                  style={{ transition: 'transform 0.2s' }}
                >
                  <p className="text-sm text-primary-foreground/70 mb-1">
                    Balance Total (Ahorros - Deuda de Tarjeta)
                  </p>
                  <div className={`text-2xl font-bold ${
                    (saldoAhorros - totalTarjeta) >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                    S/{(saldoAhorros - totalTarjeta).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ingresos */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Ingresos
                    <Badge variant="secondary" className="ml-2">+S/{totalIngresos.toFixed(2)}</Badge>
                  </CardTitle>
                  <CardDescription>Tus ingresos</CardDescription>
                </div>
                <Button onClick={() => setOpenIngreso(true)} variant="outline" size="sm">
                  + Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Últimos {ingresosMostrados.length}
                  </span>
                  {ingresos.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalIngresosOpen(true)}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Ver todos ({ingresos.length})
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  {ingresosMostrados.length === 0 && <li className="text-muted-foreground">Sin ingresos</li>}
                  <AnimatePresence>
                    {ingresosMostrados.map((ingreso: any) => (
                      <motion.li
                        key={ingreso.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-between items-center gap-2"
                      >
                        <div>
                          <span className="font-medium">{ingreso.nombre}</span>
                          <span className="ml-2 text-green-700 dark:text-green-300 font-bold">
                            +S/{Number(ingreso.ingresos).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditIngreso({ id: ingreso.id, nombre: ingreso.nombre, monto: ingreso.ingresos, tipo: ingreso.tipo })}>
                            <span className="sr-only">Editar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M15.232 5.232l-2.464-2.464a2 2 0 00-2.828 0l-6.536 6.536a2 2 0 000 2.828l2.464 2.464a2 2 0 002.828 0l6.536-6.536a2 2 0 000-2.828z" /></svg>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteIngreso(ingreso.id)}>
                            <span className="sr-only">Eliminar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M6 6l6 6M6 12L12 6" strokeWidth="2" strokeLinecap="round" /></svg>
                          </Button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gastos */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Gastos
                    <Badge variant="destructive" className="ml-2">-S/{totalGastos.toFixed(2)}</Badge>
                  </CardTitle>
                  <CardDescription>Tus gastos</CardDescription>
                </div>
                <Button onClick={() => setOpenGasto(true)} variant="outline" size="sm">
                  + Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Últimos {gastosMostrados.length}
                  </span>
                  {gastos.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalGastosOpen(true)}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Ver todos ({gastos.length})
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  {gastosMostrados.length === 0 && <li className="text-muted-foreground">Sin gastos</li>}
                  <AnimatePresence>
                    {gastosMostrados.map((gasto: any) => (
                      <motion.li
                        key={gasto.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-between items-center gap-2"
                      >
                        <div>
                          <span className="font-medium">{gasto.nombre}</span>
                          <span className="ml-2 text-red-700 dark:text-red-300 font-bold">
                            -S/{Number(gasto.gasto).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditGasto({ id: gasto.id, nombre: gasto.nombre, monto: gasto.gasto, tipo: gasto.tipo })}>
                            <span className="sr-only">Editar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M15.232 5.232l-2.464-2.464a2 2 0 00-2.828 0l-6.536 6.536a2 2 0 000 2.828l2.464 2.464a2 2 0 002.828 0l6.536-6.536a2 2 0 000-2.828z" /></svg>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteGasto(gasto.id)}>
                            <span className="sr-only">Eliminar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M6 6l6 6M6 12L12 6" strokeWidth="2" strokeLinecap="round" /></svg>
                          </Button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tarjeta de Crédito */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Tarjeta de Crédito
                    <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300">-S/{totalTarjeta.toFixed(2)}</Badge>
                  </CardTitle>
                  <CardDescription>Gastos con tarjeta</CardDescription>
                </div>
                <Button onClick={() => setOpenTarjeta(true)} variant="outline" size="sm">
                  + Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Últimos {tarjetaMostrados.length}
                  </span>
                  {tarjetaCredito.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModalTarjetaOpen(true)}
                      className="text-blue-700 border-blue-300 hover:bg-blue-50"
                    >
                      Ver todos ({tarjetaCredito.length})
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  {tarjetaMostrados.length === 0 && <li className="text-muted-foreground">Sin gastos de tarjeta</li>}
                  <AnimatePresence>
                    {tarjetaMostrados.map((tarjeta: any) => (
                      <motion.li
                        key={tarjeta.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-between items-center gap-2"
                      >
                        <div>
                          <span className="font-medium">{tarjeta.nombre}</span>
                          <span className="ml-2 text-blue-700 dark:text-blue-300 font-bold">
                            -S/{Number(tarjeta.gasto).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditTarjeta({ id: tarjeta.id, nombre: tarjeta.nombre, monto: tarjeta.gasto, tipo: tarjeta.tipo })}>
                            <span className="sr-only">Editar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M15.232 5.232l-2.464-2.464a2 2 0 00-2.828 0l-6.536 6.536a2 2 0 000 2.828l2.464 2.464a2 2 0 002.828 0l6.536-6.536a2 2 0 000-2.828z" /></svg>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteTarjeta(tarjeta.id)}>
                            <span className="sr-only">Eliminar</span>
                            <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M6 6l6 6M6 12L12 6" strokeWidth="2" strokeLinecap="round" /></svg>
                          </Button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      {/* Formularios modales */}
      <ItemForm
        open={openIngreso}
        onOpenChange={setOpenIngreso}
        onSubmit={handleCreateIngreso}
        type="ingreso"
      />
      <ItemForm
        open={!!editIngreso}
        onOpenChange={open => { if (!open) setEditIngreso(null); }}
        onSubmit={handleEditIngreso}
        initial={editIngreso || undefined}
        type="ingreso"
      />
      <ItemForm
        open={openGasto}
        onOpenChange={setOpenGasto}
        onSubmit={handleCreateGasto}
        type="gasto"
      />
      <ItemForm
        open={!!editGasto}
        onOpenChange={open => { if (!open) setEditGasto(null); }}
        onSubmit={handleEditGasto}
        initial={editGasto || undefined}
        type="gasto"
      />
      <ItemForm
        open={openTarjeta}
        onOpenChange={setOpenTarjeta}
        onSubmit={handleCreateTarjeta}
        type="tarjeta"
      />
      <ItemForm
        open={!!editTarjeta}
        onOpenChange={open => { if (!open) setEditTarjeta(null); }}
        onSubmit={handleEditTarjeta}
        initial={editTarjeta || undefined}
        type="tarjeta"
      />

      {/* Modales para ver todos los registros */}
      <ModalTodosLosRegistros
        items={ingresos}
        title="Todos los Ingresos"
        color="green"
        isOpen={modalIngresosOpen}
        onClose={() => setModalIngresosOpen(false)}
        onEdit={(item) => setEditIngreso({ 
          id: item.id, 
          nombre: item.nombre, 
          monto: item.ingresos, 
          tipo: item.tipo 
        })}
        onDelete={handleDeleteIngreso}
      />
      
      <ModalTodosLosRegistros
        items={gastos}
        title="Todos los Gastos"
        color="red"
        isOpen={modalGastosOpen}
        onClose={() => setModalGastosOpen(false)}
        onEdit={(item) => setEditGasto({ 
          id: item.id, 
          nombre: item.nombre, 
          monto: item.gasto, 
          tipo: item.tipo 
        })}
        onDelete={handleDeleteGasto}
      />

      <ModalTodosLosRegistros
        items={tarjetaCredito}
        title="Todos los Gastos de Tarjeta"
        color="blue"
        isOpen={modalTarjetaOpen}
        onClose={() => setModalTarjetaOpen(false)}
        onEdit={(item) => setEditTarjeta({ 
          id: item.id, 
          nombre: item.nombre, 
          monto: item.gasto, 
          tipo: item.tipo 
        })}
        onDelete={handleDeleteTarjeta}
      />
    </div>
  );
}