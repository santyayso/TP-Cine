import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { LogService } from './log-service';

@Injectable({ providedIn: 'root' })
export class ScannerService {
    private supabaseService = inject(Supabase);
    private logService = inject(LogService);


    async obtenerDetallePorCodigoQr(codigoQr: string): Promise<any | null> {
        const { data, error } = await this.supabaseService.cliente
            .from('detalle_ventas')
            .select(`
            id_detalle_venta,
            codigo_qr,
            validacion_candy,
            validacion_entrada,
            ventas ( estado, nombre, apellido ),
            funciones ( fecha_hora, peliculas ( titulo ) ),
            butacas_vendidas ( fila_butaca, numero_butaca, tipo_butaca ),
            candy_vendidos ( cantidad, productos_candy ( nombre ) )
        `)
            .eq('codigo_qr', codigoQr)
            .single();

        if (error) {
            console.error('Error al buscar el código QR:', error);
            return null;
        }

        return data;
    }


    async marcarComoValidado(idDetalleVenta: number, tipo: 'entrada' | 'candy'): Promise<boolean> {
        let columna = 'validacion_candy';
        if (tipo === 'entrada') {
            columna = 'validacion_entrada';
        }

        // el .eq(columna, false) hace que solo se actualice si todavía NO estaba validada.
        // Si otro scanner la validó un instante antes, no vuelve ninguna fila y devolvemos false
        const { data, error } = await this.supabaseService.cliente
            .from('detalle_ventas')
            .update({ [columna]: true })
            .eq('id_detalle_venta', idDetalleVenta)
            .eq(columna, false)
            .select(); // me devuelve las filas que modificó

        if (error) {
            console.error('Error al validar:', error);
            return false;
        }

        // si devuelve false es porque no modificó nada
        const validado = data.length > 0;

        if (validado) {
            await this.logService.registrar('Validó QR', `Detalle ${idDetalleVenta}, tipo ${tipo}`);
        }

        return validado;
    }
}