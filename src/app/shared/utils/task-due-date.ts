import type { FarmTask } from '../../service/actividades/actividades.models';
export const taskOverdueMessage = 'Esta actividad ya venció. No se registró dentro del plazo establecido.';
const farmDate = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isTaskOverdue(task: FarmTask, now = new Date()): boolean {
  return task.estado === 'PENDIENTE' && !!task.fechaLimite && task.fechaLimite.slice(0, 10) < farmDate.format(now);
}

export function localDate(now = new Date()): string {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join(
    '-',
  );
}
