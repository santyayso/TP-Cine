import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Funcion, IdiomaFuncion, FormatoFuncion } from '../models/funcionInterface';
import { Sala } from '../models/salaInterface';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
    private supabaseService = inject(Supabase);

    async obtenerFuncionesFuturasDePelicula(idPelicula: number): Promise<Funcion[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('funciones')
            .select('*')
            .eq('id_pelicula', idPelicula)
            .gt('fecha_hora', new Date().toISOString());

        if (error) {
            console.error('Error al traer funciones de la película:', error);
            return [];
        }
        return data ?? [];
    }

    async obtenerSalasActivas(): Promise<Sala[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('salas')
            .select('*')
            .eq('activo', true);

        if (error) {
            console.error('Error al traer salas:', error);
            return [];
        }
        return data ?? [];
    }


async obtenerFuncionesDelDia(fecha: Date): Promise<{ id_funcion: number; id_sala: number; fecha_hora: string; duracionBloqueada: number }[]> {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabaseService.cliente
        .from('funciones')
        .select('id_funcion, id_sala, fecha_hora, peliculas(duracion)')
        .gte('fecha_hora', inicioDia.toISOString())
        .lte('fecha_hora', finDia.toISOString());

    if (error) {
        console.error('Error al traer funciones del día:', error);
        return [];
    }

    return (data ?? []).map((fila: any) => ({
        id_funcion: fila.id_funcion,
        id_sala: fila.id_sala,
        fecha_hora: fila.fecha_hora,
        duracionBloqueada: fila.peliculas.duracion + 30,
    }));
}

    private elegirSalaDisponible(
        salas: Sala[],
        horaInicioPropuesta: Date,
        duracionPropuestaMinutos: number,
        funcionesDelDia: { id_sala: number; fecha_hora: string; duracionBloqueada: number }[]
    ): Sala | null {
        const finPropuesto = new Date(horaInicioPropuesta.getTime() + duracionPropuestaMinutos * 60000);

        for (const sala of salas) {
            const funcionesDeEstaSala = funcionesDelDia.filter((funcion) => funcion.id_sala === sala.id_sala);

            const haySuperposicion = funcionesDeEstaSala.some((funcion) => {
                const inicioExistente = new Date(funcion.fecha_hora);
                const finExistente = new Date(inicioExistente.getTime() + funcion.duracionBloqueada * 60000);

                return horaInicioPropuesta < finExistente && inicioExistente < finPropuesto;
            });

            if (!haySuperposicion) {
                return sala;
            }
        }

        return null;
    }

async crearFuncion(
    idPelicula: number,
    duracionPelicula: number,
    fechaHora: Date,
    precio: number,
    precioPreventa: number | null,
    recargoVip: number,
    castellanoSubtitulada: IdiomaFuncion,
    formato: FormatoFuncion
): Promise<boolean> {
    const salas = await this.obtenerSalasActivas();
    const funcionesDelDia = await this.obtenerFuncionesDelDia(fechaHora);

    const salaElegida = this.elegirSalaDisponible(salas, fechaHora, duracionPelicula + 30, funcionesDelDia);

    if (!salaElegida) {
        console.error('No hay salas disponibles para ese horario');
        return false;
    }

    const { data, error } = await this.supabaseService.cliente
        .from('funciones')
        .insert({
            id_pelicula: idPelicula,
            id_sala: salaElegida.id_sala,
            fecha_hora: fechaHora.toISOString(),
            precio: precio,
            precio_preventa: precioPreventa,
            castellano_subtitulada: castellanoSubtitulada,
            formato: formato,
            es_funcion_ancla: false,
            recargo_vip: recargoVip,
        })
        .select()
        .single();

    if (error) {
        console.error('Error al crear función:', error);
        return false;
    }

    await this.moverAnclaSiEsAnterior(idPelicula, fechaHora, data.id_funcion);

    return true;
}

    private generarFechasRecurrentes(
        diasSemana: number[],
        fechaDesde: Date,
        fechaHasta: Date,
        horas: number,
        minutos: number
    ): Date[] {
        const fechas: Date[] = [];
        const fechaActual = new Date(fechaDesde);

        while (fechaActual <= fechaHasta) {
            if (diasSemana.includes(fechaActual.getDay())) {
                const fechaConHora = new Date(fechaActual);
                fechaConHora.setHours(horas, minutos, 0, 0);
                fechas.push(fechaConHora);
            }

            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        return fechas;
    }


async crearFuncionesRecurrentes(
    idPelicula: number,
    duracionPelicula: number,
    diasSemana: number[],
    horas: number,
    minutos: number,
    fechaDesde: Date,
    fechaHasta: Date,
    precio: number,
    precioPreventa: number | null,
    recargoVip: number,
    castellanoSubtitulada: IdiomaFuncion,
    formato: FormatoFuncion
): Promise<{ exito: boolean; fechaFallida: Date | null }> {
    const fechas = this.generarFechasRecurrentes(diasSemana, fechaDesde, fechaHasta, horas, minutos);
    const salas = await this.obtenerSalasActivas();

    const filasAInsertar: any[] = [];

    for (const fecha of fechas) {
        const funcionesDelDia = await this.obtenerFuncionesDelDia(fecha);
        const salaElegida = this.elegirSalaDisponible(salas, fecha, duracionPelicula + 30, funcionesDelDia);

        if (!salaElegida) {
            return { exito: false, fechaFallida: fecha };
        }

        filasAInsertar.push({
            id_pelicula: idPelicula,
            id_sala: salaElegida.id_sala,
            fecha_hora: fecha.toISOString(),
            precio: precio,
            precio_preventa: precioPreventa,
            castellano_subtitulada: castellanoSubtitulada,
            formato: formato,
            es_funcion_ancla: false,
            recargo_vip: recargoVip,
        });
    }

    const { error } = await this.supabaseService.cliente
        .from('funciones')
        .insert(filasAInsertar);

    if (error) {
        console.error('Error al crear funciones recurrentes:', error);
        return { exito: false, fechaFallida: null };
    }

    return { exito: true, fechaFallida: null };
}


async eliminarFuncion(idFuncion: number): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
        .from('funciones')
        .delete()
        .eq('id_funcion', idFuncion);

    if (error) {
        console.error('Error al eliminar función:', error);
        return false;
    }
    return true;
}

private async marcarComoAncla(idFuncion: number, idPelicula: number): Promise<boolean> {
    const { error: errorLimpieza } = await this.supabaseService.cliente
        .from('funciones')
        .update({ es_funcion_ancla: false })
        .eq('id_pelicula', idPelicula);

    if (errorLimpieza) {
        console.error('Error al limpiar ancla anterior:', errorLimpieza);
        return false;
    }

    const { error } = await this.supabaseService.cliente
        .from('funciones')
        .update({ es_funcion_ancla: true })
        .eq('id_funcion', idFuncion);

    if (error) {
        console.error('Error al marcar función como ancla:', error);
        return false;
    }

    return true;
}



async reasignarAnclaSiNecesario(idPelicula: number): Promise<void> {
    const funcionesFuturas = await this.obtenerFuncionesFuturasDePelicula(idPelicula);

    if (funcionesFuturas.length === 0) {
        return;
    }

    const tieneAncla = funcionesFuturas.some((funcion) => funcion.es_funcion_ancla);
    if (tieneAncla) {
        return;
    }

    const funcionesOrdenadas = [...funcionesFuturas].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
    );

    await this.marcarComoAncla(funcionesOrdenadas[0].id_funcion, idPelicula);
}



async configurarPreventa(idPelicula: number, precioPreventa: number | null): Promise<boolean> {
    const funcionesFuturas = await this.obtenerFuncionesFuturasDePelicula(idPelicula);

    if (funcionesFuturas.length === 0) {
        console.error('No hay funciones futuras para configurar preventa');
        return false;
    }

    const funcionesOrdenadas = [...funcionesFuturas].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
    );

    const exitoAncla = await this.marcarComoAncla(funcionesOrdenadas[0].id_funcion, idPelicula);

    if (!exitoAncla) {
        return false;
    }

    if (precioPreventa !== null) {
        const { error } = await this.supabaseService.cliente
            .from('funciones')
            .update({ precio_preventa: precioPreventa })
            .eq('id_pelicula', idPelicula)
            .gt('fecha_hora', new Date().toISOString());

        if (error) {
            console.error('Error al aplicar precio de preventa:', error);
            return false;
        }
    }

    return true;
}

async desactivarPreventa(idPelicula: number): Promise<boolean> {
    const { error: errorAncla } = await this.supabaseService.cliente
        .from('funciones')
        .update({ es_funcion_ancla: false })
        .eq('id_pelicula', idPelicula);

    if (errorAncla) {
        console.error('Error al desactivar ancla:', errorAncla);
        return false;
    }

    const { error: errorPrecio } = await this.supabaseService.cliente
        .from('funciones')
        .update({ precio_preventa: null })
        .eq('id_pelicula', idPelicula)
        .gt('fecha_hora', new Date().toISOString());

    if (errorPrecio) {
        console.error('Error al limpiar precios de preventa:', errorPrecio);
        return false;
    }

    return true;
}

private async moverAnclaSiEsAnterior(idPelicula: number, fechaNuevaFuncion: Date, idFuncionNueva: number): Promise<void> {
    const funcionesFuturas = await this.obtenerFuncionesFuturasDePelicula(idPelicula);

    const anclaActual = funcionesFuturas.find((funcion) => funcion.es_funcion_ancla);

    if (!anclaActual) {
        return;
    }

    const esMasTemprana = fechaNuevaFuncion < new Date(anclaActual.fecha_hora);

    if (esMasTemprana) {
        await this.marcarComoAncla(idFuncionNueva, idPelicula);
    }
}


async modificarFuncion(
    idFuncion: number,
    idPelicula: number,
    duracionPelicula: number,
    fechaHora: Date,
    precio: number,
    precioPreventa: number | null,
    recargoVip: number,
    castellanoSubtitulada: IdiomaFuncion,
    formato: FormatoFuncion
): Promise<boolean> {
    const salas = await this.obtenerSalasActivas();
    const funcionesDelDia = (await this.obtenerFuncionesDelDia(fechaHora)).filter(
        (funcion) => funcion.id_funcion !== idFuncion
    );

    const salaElegida = this.elegirSalaDisponible(salas, fechaHora, duracionPelicula + 30, funcionesDelDia);

    if (!salaElegida) {
        console.error('No hay salas disponibles para ese horario');
        return false;
    }

    const { error } = await this.supabaseService.cliente
        .from('funciones')
        .update({
            id_sala: salaElegida.id_sala,
            fecha_hora: fechaHora.toISOString(),
            precio: precio,
            precio_preventa: precioPreventa,
            castellano_subtitulada: castellanoSubtitulada,
            formato: formato,
            recargo_vip: recargoVip,
        })
        .eq('id_funcion', idFuncion);

    if (error) {
        console.error('Error al modificar función:', error);
        return false;
    }

    await this.moverAnclaSiEsAnterior(idPelicula, fechaHora, idFuncion);

    return true;
}


async tieneEntradasVendidas(idFuncion: number): Promise<boolean> {
    const { data, error } = await this.supabaseService.cliente
        .from('detalle_ventas')
        .select('id_detalle_venta, ventas(estado)')
        .eq('id_funcion', idFuncion);

    if (error) {
        console.error('Error al verificar entradas vendidas:', error);
        return true; // si no pudimos chequear, mejor bloquear el borrado por las dudas
    }

    return (data ?? []).some((fila: any) => fila.ventas?.estado === 'activa');
}

}