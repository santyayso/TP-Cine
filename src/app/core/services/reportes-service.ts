import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private supabaseService = inject(Supabase);

async obtenerFacturacionDeHoy(): Promise<number> {
  const hoy = new Date();
  const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
  const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

  const { data, error } = await this.supabaseService.cliente
    .from('ventas')
    .select('total')
    .gte('fecha_compra', inicioDelDia.toISOString())
    .lte('fecha_compra', finDelDia.toISOString())
    .eq('estado', 'activa');

  if (error) {
    console.error('Error al traer facturación:', error);
    return 0;
  }

  const total = data.reduce((acumulador: number, venta) => acumulador + venta.total, 0);
  return total;
}
}