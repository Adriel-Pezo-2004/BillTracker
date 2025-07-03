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
  color: 'green' | 'red', 
  isOpen: boolean, 
  onClose: () => void,
  onEdit: (item: any) => void,
  onDelete: (id: string) => void
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
            <div className="space-y-3">
              {sortedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{item.nombre}</div>
                    <div className="text-sm text-gray-500">
                      {item.createdAt
                        ? format(new Date(item.createdAt), 'dd MMM yyyy', { locale: es })
                        : 'Sin fecha'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tipo: {item.tipo || 'Sin tipo'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${color === 'green' ? 'text-green-700' : 'text-red-700'}`}>
                      {color === 'green' ? '+' : '-'}S/{Number(item.ingresos || item.gasto || item.monto || 0).toFixed(2)}
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

// Formulario para crear o editar ingresos/gastos
function ItemForm({ open, onOpenChange, onSubmit, initial, type }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSubmit: (data: { nombre: string, monto: number, tipo: string }) => Promise<void>,
  initial?: { nombre: string, monto: number, tipo: string },
  type: 'ingreso' | 'gasto'
}) {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [monto, setMonto] = useState(initial?.monto?.toString() || '');
  const [loading, setLoading] = useState(false);

  const tipoOptions =
    type === 'gasto'
      ? [
          'Banco',
          'Gasolina',
          'Comisión ID',
          'Gerita',
          'Camila',
          'Ximena',
          'Otros',
          'IA',
          'Comida',
          'Ocio',
        ]
      : [
          'Mesada',
          'Tareas',
          'Desarrollo',
          'Taxi',
          'Otros',
        ];

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
                    ? `Editar ${type === 'ingreso' ? 'Ingreso' : 'Gasto'}`
                    : `Nuevo ${type === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
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
  const [loading, setLoading] = useState(true);

  // Modals
  const [openIngreso, setOpenIngreso] = useState(false);
  const [openGasto, setOpenGasto] = useState(false);
  const [editIngreso, setEditIngreso] = useState<{ id: string, nombre: string, monto: number, tipo: string } | null>(null);
  const [editGasto, setEditGasto] = useState<{ id: string, nombre: string, monto: number, tipo: string } | null>(null);
  
  // Modales para ver todos
  const [modalIngresosOpen, setModalIngresosOpen] = useState(false);
  const [modalGastosOpen, setModalGastosOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const ingresosRes = await fetch('/api/ingresos');
    setIngresos(await ingresosRes.json());
    const gastosRes = await fetch('/api/gastos');
    setGastos(await gastosRes.json());
    setLoading(false);
  }

  // Suma de ingresos y gastos
  const totalIngresos = useMemo(
    () => ingresos.reduce((acc, curr) => acc + (curr.ingresos || curr.monto || 0), 0),
    [ingresos]
  );
  const totalGastos = useMemo(
    () => gastos.reduce((acc, curr) => acc + (curr.gasto || curr.monto || 0), 0),
    [gastos]
  );
  const ahorro = totalIngresos - totalGastos;

  // Solo mostrar 5 registros
  const ingresosMostrados = ingresos
    .slice()
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  const gastosMostrados = gastos
    .slice()
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  // Crear ingreso
  async function handleCreateIngreso(data: { nombre: string, monto: number, tipo: string }) {
    await fetch('/api/ingresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, ingresos: data.monto, tipo: data.tipo }),
    });
    await fetchData();
  }

  // Editar ingreso
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

  // Eliminar ingreso
  async function handleDeleteIngreso(id: string) {
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  // Crear gasto
  async function handleCreateGasto(data: { nombre: string, monto: number, tipo: string }) {
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: data.nombre, gasto: data.monto, tipo: data.tipo }),
    });
    await fetchData();
  }

  // Editar gasto
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

  // Eliminar gasto
  async function handleDeleteGasto(id: string) {
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-background">
      {loading ? (
        <Spinner />
      ) : (
      <main className="max-w-6xl mx-auto py-10 px-4 flex flex-col gap-8">
        {/* Ahorro total */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="w-full bg-primary text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Ahorro actual</CardTitle>
              <CardDescription className="text-center">
                Suma de ingresos menos suma de gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-center text-4xl font-bold py-4"
                initial={false}
                whileHover={{ opacity: 1, y: -20 }}
                whileTap={{ scale: 1.05 }}
                style={{ opacity: 0.8, y: 0, transition: 'opacity 0.24s, transform 0.24s' }}
              >
                S/{ahorro.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Bloques de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Badge variant="secondary" className="ml-2">+S/{totalIngresos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                  </CardTitle>
                  <CardDescription>Lista de todos tus ingresos</CardDescription>
                </div>
                <Button onClick={() => setOpenIngreso(true)} variant="outline" size="sm">
                  + Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Últimos {ingresosMostrados.length} ingresos
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
                            +S/{Number(ingreso.ingresos || ingreso.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditIngreso({ id: ingreso.id, nombre: ingreso.nombre, monto: ingreso.ingresos || ingreso.monto, tipo: ingreso.tipo })}>
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
                    <Badge variant="destructive" className="ml-2">-S/{totalGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                  </CardTitle>
                  <CardDescription>Lista de todos tus gastos</CardDescription>
                </div>
                <Button onClick={() => setOpenGasto(true)} variant="outline" size="sm">
                  + Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Últimos {gastosMostrados.length} gastos
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
                            -S/{Number(gasto.gasto || gasto.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditGasto({ id: gasto.id, nombre: gasto.nombre, monto: gasto.gasto || gasto.monto, tipo: gasto.tipo })}>
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
        </div>
        
      </main>
      )}
      
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
          monto: item.ingresos || item.monto, 
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
          monto: item.gasto || item.monto, 
          tipo: item.tipo 
        })}
        onDelete={handleDeleteGasto}
      />
    </div>
  );
}