import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Venta } from '../models/ventaInterface';
import { CandyVendido } from '../models/candyVendidointerface';
import { ButacaVendida } from '../models/butacaVendida';

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



    
}