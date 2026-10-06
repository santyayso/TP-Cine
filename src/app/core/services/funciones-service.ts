import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Funcion, IdiomaFuncion, FormatoFuncion } from '../models/funcionInterface';
import { Sala } from '../models/salaInterface';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
    private supabaseService = inject(Supabase);


    // =====================
    // CREAR FUNCIONES
    // =====================

    async obtenerFuncionesFuturasDePelicula(idPelicula: number): Promise<Funcion[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('funciones')
            .select('*')
            .eq('id_pelicula', idPelicula)
            .gt('fecha_hora', new Date().toISOString())
            .order('fecha_hora', { ascending: true });

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


    // fucnion para obtener la informacion de funciones que hay en el dia pasado por parametro (en cualquier sala)
    async obtenerFuncionesDeDiaEspecifico(fecha: Date): Promise<{ id_funcion: number; id_sala: number; fecha_hora: string; duracion: number }[]> {
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
            duracion: fila.peliculas.duracion,
        }));
    }


    async crearFuncion(funcion: Omit<Funcion, 'id_sala' | 'id_funcion' | 'es_funcion_ancla'>, duracionPelicula: number): Promise<boolean> {
        const fechaHoraDate = new Date(funcion.fecha_hora)
        const salasActivas = await this.obtenerSalasActivas();
        const funcionesEnDiaPropuesto = await this.obtenerFuncionesDeDiaEspecifico(fechaHoraDate);

        const salaSeleccionada = this.elegirSalaDisponible(salasActivas, fechaHoraDate, duracionPelicula, funcionesEnDiaPropuesto);

        if (!salaSeleccionada) {
            console.error('No hay salas disponibles para ese horario');
            return false;
        }

        const { data, error } = await this.supabaseService.cliente
            .from('funciones')
            .insert({
                id_pelicula: funcion.id_pelicula,
                id_sala: salaSeleccionada.id_sala,
                fecha_hora: fechaHoraDate.toISOString(),
                precio: funcion.precio,
                precio_preventa: funcion.precio_preventa,
                castellano_subtitulada: funcion.castellano_subtitulada,
                formato: funcion.formato,
                es_funcion_ancla: false,
                recargo_vip: funcion.recargo_vip,
            })
            .select()
            .single();

        if (error) {
            console.error('Error al crear función:', error);
            return false;
        }

        await this.moverAnclaSiEsAnterior(funcion.id_pelicula, fechaHoraDate, data.id_funcion);

        return true;
    }



    async crearFuncionesRecurrentes(funcion: Omit<Funcion, 'id_sala' | 'id_funcion' | 'es_funcion_ancla' | 'fecha_hora'>, idPelicula: number, duracionPelicula: number, diasSemana: number[], horas: number, minutos: number, fechaDesde: Date, fechaHasta: Date):
        Promise<{ exito: boolean; fechaFallida: Date | null }> {
        const fechas = this.generarFechasRecurrentes(diasSemana, fechaDesde, fechaHasta, horas, minutos);


        // verficicacion por si los días elegidos no caen dentro del rango y no se generó ninguna)
        // por ejemplo si eligio del 27/10 al 30/10 y eligió sabado, y en esos 3 dia sno hay ningun sabado
        if (fechas.length === 0) {
            return { exito: false, fechaFallida: null };
        }

        const salas = await this.obtenerSalasActivas();

        const filasAInsertar: any[] = [];

        for (const fecha of fechas) {
            const funcionesDelDiaPropuesto = await this.obtenerFuncionesDeDiaEspecifico(fecha);
            const salaElegida = this.elegirSalaDisponible(salas, fecha, duracionPelicula, funcionesDelDiaPropuesto);

            if (!salaElegida) {
                return { exito: false, fechaFallida: fecha };
            }

            filasAInsertar.push({
                id_pelicula: idPelicula,
                id_sala: salaElegida.id_sala,
                fecha_hora: fecha.toISOString(),
                precio: funcion.precio,
                precio_preventa: funcion.precio_preventa,
                castellano_subtitulada: funcion.castellano_subtitulada,
                formato: funcion.formato,
                es_funcion_ancla: false,
                recargo_vip: funcion.recargo_vip,
            });
        }

        const { data: funcionesCreadas, error } = await this.supabaseService.cliente
            .from('funciones')
            .insert(filasAInsertar)
            .select('id_funcion, fecha_hora');

        if (error) {
            console.error('Error al crear funciones recurrentes:', error);
            return { exito: false, fechaFallida: null };
        }


        funcionesCreadas.sort(
            (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        )

        const funcionMasTemprana = funcionesCreadas[0]

        await this.moverAnclaSiEsAnterior(idPelicula, new Date(funcionMasTemprana.fecha_hora), funcionMasTemprana.id_funcion);



        return { exito: true, fechaFallida: null };
    }


    private generarFechasRecurrentes(diasSemana: number[], fechaDesde: Date, fechaHasta: Date, horas: number, minutos: number): Date[] {
        const fechas: Date[] = [];
        const fechaIteracion = new Date(fechaDesde);

        while (fechaIteracion <= fechaHasta) {
            // fechaIteracion.getDay() me dice que dia de la semana cae, con un numero del 0 al  6
            let diaSemana = fechaIteracion.getDay()

            // si el dia de la semana de la fecha que se esta iterando coincide con los dias de la semana que se quiere, se crea la fecha para pushearla en la lista
            if (diasSemana.includes(diaSemana)) {
                // se crea la fecha
                const fechaConHora = new Date(fechaIteracion);

                // se setean las horas y los minutos
                fechaConHora.setHours(horas, minutos, 0, 0);

                // se pushea en la lista
                fechas.push(fechaConHora);
            }

            // avanzamos un dia en cada iteracion
            fechaIteracion.setDate(fechaIteracion.getDate() + 1);
        }

        return fechas;
    }



    private elegirSalaDisponible(salasActivas: Sala[], horaInicio: Date, duracion: number, funcionesEnDiaPropuesto: { id_sala: number; fecha_hora: string; duracion: number }[]): Sala | null {
        // duracion con el margen para la funcion NUEVA
        const duracionMargenMilisegundosNuevaFuncion = (duracion + 30) * 60000
        const horaFin = new Date(horaInicio.getTime() + duracionMargenMilisegundosNuevaFuncion);

        // recorro TODAS las salas (activas)
        for (const sala of salasActivas) {
            // filtro las funciones que  ya esten asignadas en el dia propuesto (para la nueva funcion) quedandome unicamente con las que son en ESTA sala (esta iteracion)
            const funcionesDeEstaSalaYaPropuestas = funcionesEnDiaPropuesto.filter((funcion) => funcion.id_sala === sala.id_sala);

            // me fijo con el some, si algunas de las funciones ya asignadas  en el dia propuesto (para la nueva funcion) en ESTA sala se pisa con la funcion NUEVA
            const haySuperposicion = funcionesDeEstaSalaYaPropuestas.some((funcion) => {
                // duracion con el margen para CADA funcion  que ya esta asignada para el dia propuesto (para la nueva funcion) en ESTA sala
                const duracionMargenMilisegundos = (funcion.duracion + 30) * 60000
                const inicioExistente = new Date(funcion.fecha_hora);
                const finExistente = new Date(inicioExistente.getTime() + duracionMargenMilisegundos);

                return horaInicio < finExistente && inicioExistente < horaFin;
            });

            if (!haySuperposicion) {
                // corta la ejecucion de toda la funcion si el some NO encuentra ninguna superposicion (retorna la sala)
                return sala;
            }
        }
        // si el for no encuentra ninguna sala, reotrna null
        return null;
    }




    // =====================
    // EDITAR / ELIMINAR FUNCONES
    // =====================


    async tieneEntradasVendidas(idFuncion: number): Promise<boolean> {
        const { data, error } = await this.supabaseService.cliente
            .from('detalle_ventas')
            .select('id_detalle_venta, ventas(estado)')
            .eq('id_funcion', idFuncion);

        if (error) {
            console.error('Error al verificar entradas vendidas:', error);
            return true;
        }

        if (data.some((fila: any) => fila.ventas.estado == 'activa')) {
            return true
        }
        else {
            return false
        }

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



    async modificarFuncion(funcion: Omit<Funcion, 'id_sala' | 'es_funcion_ancla'>, duracionPelicula: number): Promise<boolean> {
        const fechaHoraDate = new Date(funcion.fecha_hora)


        const { data: dataFuncionActual, error: errorFuncionGuardada } = await this.supabaseService.cliente
            .from('funciones')
            .select('id_sala, fecha_hora')
            .eq('id_funcion', funcion.id_funcion)
            .single();

        if (errorFuncionGuardada) {
            console.error('Error al traer la función actual:', errorFuncionGuardada);
            return false;
        }

        // comparamos en milisegundos para ver si el admin en el form cambió la fecha y hora o si modificó otra cosa
        const cambioFechaHora = new Date(dataFuncionActual.fecha_hora).getTime() !== fechaHoraDate.getTime();

        // si no entra al if de cambioFechaHora, es porque la fecha y hora no cambió, entonces dejamos la misma sala
        let idSala = dataFuncionActual.id_sala

        // si hubo cambio de fechaHora, reasignamos sala, si no, dejamos la sala que estaba
        if (cambioFechaHora) {
            const salas = await this.obtenerSalasActivas();


            // traemos las funciones que ya estan asignadas en el dia propuesto y sacamos ESTA misma funcion
            const funcionesDelDiaPropuesto = (await this.obtenerFuncionesDeDiaEspecifico(fechaHoraDate))
                .filter((f) => f.id_funcion !== funcion.id_funcion);

            const salaElegida = this.elegirSalaDisponible(salas, fechaHoraDate, duracionPelicula, funcionesDelDiaPropuesto);

            if (!salaElegida) {
                console.error('No hay salas disponibles para ese horario');
                return false;
            }
            idSala = salaElegida.id_sala;
        }


        const { error } = await this.supabaseService.cliente
            .from('funciones')
            .update({
                id_sala: idSala,
                fecha_hora: fechaHoraDate.toISOString(),
                precio: funcion.precio,
                precio_preventa: funcion.precio_preventa,
                castellano_subtitulada: funcion.castellano_subtitulada,
                formato: funcion.formato,
                recargo_vip: funcion.recargo_vip,
            })
            .eq('id_funcion', funcion.id_funcion);

        if (error) {
            console.error('Error al modificar función:', error);
            return false;
        }

        await this.moverAnclaSiEsAnterior(funcion.id_pelicula, fechaHoraDate, funcion.id_funcion);

        return true;
    }



    // =====================
    // PREVENTA
    // =====================

    // funcion general para configurar una preventa
    async configurarPreventa(idPelicula: number, precioPreventa: number): Promise<boolean> {
        const funcionesFuturas = await this.obtenerFuncionesFuturasDePelicula(idPelicula);

        if (funcionesFuturas.length === 0) {
            console.error('No hay funciones futuras para configurar preventa');
            return false;
        }

        const funcionesOrdenadas = funcionesFuturas.sort(
            (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        );

        let funcionMasTemprana = funcionesOrdenadas[0]

        const exitoAncla = await this.marcarComoAncla(funcionMasTemprana.id_funcion, idPelicula);

        if (!exitoAncla) {
            return false;
        }


        const { error } = await this.supabaseService.cliente
            .from('funciones')
            .update({ precio_preventa: precioPreventa })
            .eq('id_pelicula', idPelicula)
            .gt('fecha_hora', new Date().toISOString());

        if (error) {
            console.error('Error al aplicar precio de preventa:', error);
            return false;

        }

        return true;
    }




    // marca como ancla una funcion y limpia si habia un ancla anterior
    // a esta funcion le tenemos que pasar especificamente que funcion queremos marcar como ancla, o sea casi no calcula nada
    private async marcarComoAncla(idFuncion: number, idPelicula: number): Promise<boolean> {
        // limpiamos si habia un ancla anterior, buscando por pelicula 
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



    //  con esta funcion, decidimos si se adelanto la fecha_hora de la primer funcion para mover el ancla (esto puede suceder si se modifican funciones o si se cargan nuevas funciones)
    // si se modifico, llamamos a marcarComoAncla para marcar el ancla de nuevo
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




    // esta funcion la usamos para cuando teniamos una preventa activa y eliminamos una funcion
    // si NINGUNA es funcion ancla de todas las que quedaron (luego de eliminar), nos da el indicio de que se borro la funcion ancla, entonces se reasigna poniendo la mas temprana
    async reasignarAnclaSiNecesario(idPelicula: number): Promise<void> {
        const funcionesFuturas = await this.obtenerFuncionesFuturasDePelicula(idPelicula);

        // si habia una funcion sola y la borramos, obviamente la preventa desaparece
        if (funcionesFuturas.length === 0) {
            return;
        }

        // si en una de las funciones que quedaron luego de borrar esta la funcion ancla, no hacemos nada
        // es decir significa que la que borramos no es el ancla
        const tieneAncla = funcionesFuturas.some((funcion) => funcion.es_funcion_ancla);
        if (tieneAncla) {
            return;
        }

        const funcionesOrdenadas = funcionesFuturas.sort(
            (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        );

        let funcionMasTemprana = funcionesOrdenadas[0]
        await this.marcarComoAncla(funcionMasTemprana.id_funcion, idPelicula);
    }




    // funcion sencilla para desactivar preventa
    // bora todas las anclas y todos los precio_preventa
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










}