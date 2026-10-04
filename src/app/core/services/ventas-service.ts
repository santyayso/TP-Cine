import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Venta } from '../models/ventaInterface';
import { CandyVendido } from '../models/candyVendidointerface';
import { ButacaVendida } from '../models/butacaVendida';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class VentasService {
    private supabaseService = inject(Supabase);

    async crearVenta(datos: Omit<Venta, 'id_venta' | 'fecha_compra' | 'estado'>): Promise<number | null> {
        const { data, error } = await this.supabaseService.cliente
            .from('ventas')
            .insert({
                ...datos,
                fecha_compra: new Date().toISOString(),
                estado: 'activa',
            })
            .select()
            .single()

        if (error) {
            console.error('Error al crear venta:', error);
            return null;
        }

        return data.id_venta
    }

    async crearDetalleVenta(idVenta: number, codigoQr: string, idFuncion: number): Promise<number | null> {
        const { data, error } = await this.supabaseService.cliente
            .from('detalle_ventas')
            .insert({
                id_venta: idVenta,
                codigo_qr: codigoQr,
                id_funcion: idFuncion,
                validacion_candy: false,
                validacion_entrada: false,
            })
            .select()
            .single()

        if (error) {
            console.error('Error al crear detalle de venta:', error);
            return null
        }

        return data.id_detalle_venta
    }


    async crearButacasVendidas(butacas: Omit<ButacaVendida, 'id_butaca_vendida'>[]): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('butacas_vendidas')
            .insert(butacas)

        if (error) {
            console.error('Error al crear butacas vendidas:', error);
            return false
        }

        return true;
    }

    async crearCandyVendidos(productos: Omit<CandyVendido, 'id_candy_vendido' | 'nombre'>[]): Promise<boolean> {
        if (productos.length === 0) {
            return true;
        }


        const { error } = await this.supabaseService.cliente
            .from('candy_vendidos')
            .insert(productos)

        if (error) {
            console.error('Error al crear candy vendidos:', error);
            return false
        }

        return true
    }


    async obtenerComprasDeUsuario(idUsuario: string): Promise<any[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('ventas')
            .select(`
      id_venta,
      nombre,
      apellido,
      fecha_compra,
      total,
      estado,
      detalle_ventas (
        id_detalle_venta,
        codigo_qr,
        funciones (
          fecha_hora,
          peliculas ( id_pelicula, titulo, portada, restriccion_edad )
        ),
        butacas_vendidas ( fila_butaca, numero_butaca, tipo_butaca, precio_pagado ),
        candy_vendidos ( cantidad, precio_pagado, productos_candy ( nombre ) )
      )
    `)
            .eq('id_usuario', idUsuario)
            .order('fecha_compra', { ascending: false });

        if (error) {
            console.error('Error al traer compras:', error);
            return [];
        }
        return data ?? [];
    }

    async reembolsarVenta(idVenta: number): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('ventas')
            .update({ estado: 'cancelada' })
            .eq('id_venta', idVenta);

        if (error) {
            console.error('Error al reembolsar venta:', error);
            return false;
        }
        return true;
    }





    generarPdfCompra(
        nombreComprador: string,
        apellidoComprador: string,
        tituloPelicula: string,
        restriccionEdad: number | null,
        fechaHoraFuncion: string,
        butacas: { fila: string; numero: number; tipo: string }[],
        candy: { nombre: string; cantidad: number }[],
        codigoQr: string
    ) {
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(20);
        doc.text('Entrada de cine', 20, y);

        y += 15;
        doc.setFontSize(12);
        doc.text(`Comprador: ${nombreComprador} ${apellidoComprador}`, 20, y);

        y += 10;
        doc.text(`Película: ${tituloPelicula}`, 20, y);

        y += 8;
        doc.text(
            `Función: ${new Date(fechaHoraFuncion).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })}`,
            20, y
        );

        if (restriccionEdad) {
            y += 8;
            doc.text(
                `Restricción: +${restriccionEdad}. Los menores deben ir acompañados de un adulto.`,
                20, y
            );
        }

        y += 12;
        doc.text('Butacas:', 20, y);
        for (const butaca of butacas) {
            y += 7;
            doc.text(`${butaca.fila}${butaca.numero} (${butaca.tipo})`, 25, y);
        }

        if (candy.length > 0) {
            y += 12;
            doc.text('Candy:', 20, y);
            for (const item of candy) {
                y += 7;
                doc.text(`${item.nombre} x${item.cantidad}`, 25, y);
            }
        }

        doc.save(`entrada-${codigoQr}.pdf`);
    }


}