export interface FarmSummary {
  id: number;
  nombre: string;
  direccion: string;
  rol: string;
}

export interface DashboardResponse {
  ganado: { total: number; saludables: number; enAtencion: number; pesoPromedio: number };
  inventario: { stockBajo: number };
  tareas: { pendientes: number; completadas: number };
  necesidades: { abiertas: number };
  finanzas: { totalMes: number };
  proximosControles: { descripcion: string; proximoControl: string; tipo: string }[];
}
