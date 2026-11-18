export interface FarmAlert {
  tareaId?: number;
  tareaVencida?: boolean;
  fechaLimite?: string | null;
  id: string;
  titulo: string;
  detalle: string | null;
  fecha: string | null;
  destino: 'ACTIVIDAD' | 'COMPRAS';
}
