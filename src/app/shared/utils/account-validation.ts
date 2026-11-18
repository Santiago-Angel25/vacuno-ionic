import type { AbstractControl, ValidationErrors } from '@angular/forms';

import { localDate } from './task-due-date';

export const phonePattern = /^[0-9]{10}$/;
export const passwordPattern = /^(?=.*[0-9])(?=.*[^\p{L}\p{N}\s])[\s\S]*$/u;

export function phoneDigits(value?: string | null): string {
  return (value ?? '').replace(/[^0-9]/g, '').slice(0, 10);
}

export function birthDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= localDate()
    ? null
    : { birthDate: true };
}
