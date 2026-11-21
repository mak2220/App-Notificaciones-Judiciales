export interface NotificacionBuscable {
    id: string;
    nroExpediente: string;
    caratula: string;
    destinatario: string;
    domicilio: string;
    estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA';
}

export function normalizarTexto(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export function coincideNotificacion(n: NotificacionBuscable, termino: string): boolean {
    const query = normalizarTexto(termino);
    if (!query) return false;

    return (
    normalizarTexto(n.nroExpediente).includes(query) ||
    normalizarTexto(n.destinatario).includes(query) ||
    normalizarTexto(n.caratula).includes(query) ||
    normalizarTexto(n.domicilio).includes(query)
    );
}
