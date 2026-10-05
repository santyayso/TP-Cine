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


async obtenerPeliculasMasVistas(dias: number): Promise<{ titulo: string; cantidad: number }[]> {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);

    const { data, error } = await this.supabaseService.cliente
        .from('butacas_vendidas')
        .select('funciones(peliculas(titulo)), detalle_ventas(ventas(fecha_compra, estado))');

    if (error) {
        console.error('Error al traer las entradas vendidas:', error);
        return [];
    }

    const peliculas: { titulo: string; cantidad: number }[] = [];

    for (const fila of (data ?? []) as any[]) {
        const venta = fila.detalle_ventas?.ventas;
        const titulo = fila.funciones?.peliculas?.titulo;

        if (!venta || !titulo) {
            continue;
        }

        const esDelPeriodo = new Date(venta.fecha_compra) >= fechaDesde;
        const estaActiva = venta.estado === 'activa';

        if (!esDelPeriodo || !estaActiva) {
            continue;
        }

        const indiceExistente = peliculas.findIndex((pelicula) => pelicula.titulo === titulo);

        if (indiceExistente === -1) {
            peliculas.push({ titulo: titulo, cantidad: 1 });
        } else {
            peliculas[indiceExistente].cantidad++;
        }
    }

    peliculas.sort((a, b) => b.cantidad - a.cantidad);

    return peliculas;
}
async obtenerCandyMasVendido(dias: number): Promise<{ nombre: string; cantidad: number }[]> {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);

    const { data, error } = await this.supabaseService.cliente
        .from('candy_vendidos')
        .select('cantidad, productos_candy(nombre), detalle_ventas(ventas(fecha_compra, estado))');

    if (error) {
        console.error('Error al traer el candy vendido:', error);
        return [];
    }

    const productos: { nombre: string; cantidad: number }[] = [];

    for (const fila of (data ?? []) as any[]) {
        const venta = fila.detalle_ventas?.ventas;
        const nombre = fila.productos_candy?.nombre;

        if (!venta || !nombre) {
            continue;
        }

        const esDelPeriodo = new Date(venta.fecha_compra) >= fechaDesde;
        const estaActiva = venta.estado === 'activa';

        if (!esDelPeriodo || !estaActiva) {
            continue;
        }

        const indiceExistente = productos.findIndex((producto) => producto.nombre === nombre);

        if (indiceExistente === -1) {
            productos.push({ nombre: nombre, cantidad: fila.cantidad });
        } else {
            productos[indiceExistente].cantidad += fila.cantidad;
        }
    }

    productos.sort((a, b) => b.cantidad - a.cantidad);

    return productos;
}

}