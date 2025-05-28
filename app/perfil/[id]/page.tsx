"use client"

import { useEffect, useState } from "react"
import { UserIcon, EnvelopeIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline"

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUserId(resolvedParams.id)
    }

    loadParams()
  }, [params])

  useEffect(() => {
    if (!userId) return

    fetch(`/api/perfil/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setPerfil(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching profile:", error)
        setLoading(false)
      })
  }, [userId])

  if (loading) return <div className="p-8">Cargando...</div>
  if (!perfil || perfil.error) return <div className="p-8 text-red-500">Usuario no encontrado</div>

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center space-x-4 mb-6">
        <UserIcon className="h-12 w-12 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold">Perfil de Usuario</h2>
          <p className="text-gray-500 text-sm">ID: {perfil.id}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <EnvelopeIcon className="h-6 w-6 text-gray-400" />
          <span className="font-medium">Email:</span>
          <span>{perfil.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
          <span className="font-medium">Ahorro:</span>
          <span>${perfil.ahorro}</span>
        </div>
        <div className="text-gray-500 text-sm">
          <span>Creado: {new Date(perfil.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-gray-500 text-sm">
          <span>Actualizado: {new Date(perfil.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
