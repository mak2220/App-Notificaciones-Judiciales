'use client'

import React from 'react'

interface BotonSubirArchivoProps {
    id: string
  // Pasamos la Server Action como una propiedad nativa
    action: (formData: FormData) => Promise<void>
}

export default function BotonSubirArchivo({ id, action }: BotonSubirArchivoProps) {
return (
    <form action={action} className="flex items-center gap-1">
        <input type="hidden" name="id" value={id} />
        <label className="cursor-pointer text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1 rounded border border-slate-300 transition-colors shadow-xs">
            Subir Archivo
        <input 
            type="file" 
            name="archivoDocumento" 
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                e.target.form?.requestSubmit()
                }
            }} 
                className="hidden"
            />
        </label>
    </form>
 )
}
