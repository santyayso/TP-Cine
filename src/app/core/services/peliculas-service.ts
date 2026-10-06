import { Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Pelicula } from '../models/peliculaInterface';
import { Funcion } from '../models/funcionInterface';

@Injectable({
    providedIn: 'root',
})

export class PeliculasService {



    constructor(private supabaseService: Supabase) { }

    async obtenerTodasLasPeliculasActivas() {
        const { data, error } = await this.supabaseService.cliente
            .from('peliculas')
            .select('*, funciones(*), pelicula_generos(generos(*))')
            .eq('activo', true)


        if (error) {
            console.error('Error:', error);
            return []
        }

        return data ?? []

    }


    async obtenerTodosLosGeneros() {
        const { data, error } = await this.supabaseService.cliente
            .from('generos')
            .select('*')

        if (error) {
            console.error('Error:', error);
            return []
        }

        return data ?? []
    }


    async obtenerPeliculaPorId(id: string | number) {
        const { data, error } = await this.supabaseService.cliente
            .from('peliculas')
            .select('*, funciones(*), pelicula_generos(generos(*))')
            .eq('id_pelicula', id)
            .single();

        if (error) {
            console.error('Error al traer película:', error);
            return null;
        }

        return data;
    }


    async obtenerPeliculasAdmin(): Promise<Pelicula[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('peliculas')
            .select('*, funciones(*), pelicula_generos(generos(*))')
            .order('id_pelicula');

        if (error) {
            console.error('Error al traer películas (admin):', error);
            return [];
        }
        return data ?? [];
    }

    async crearPelicula(datos: Omit<Pelicula, 'id_pelicula' | 'activo' | 'funciones' | 'pelicula_generos'>, idsGeneros: number[], imagen: File): Promise<boolean> {

        const nombreArchivo = `${Date.now()}_${imagen.name}`;

        const { error: errorSubida } = await this.supabaseService.cliente.storage
            .from('portadas')
            .upload(nombreArchivo, imagen);

        if (errorSubida) {
            console.error('Error al subir la portada:', errorSubida);
            return false;
        }

        const { data: urlData } = this.supabaseService.cliente.storage
            .from('portadas')
            .getPublicUrl(nombreArchivo);

        const { data, error } = await this.supabaseService.cliente
            .from('peliculas')
            .insert({ ...datos, portada: urlData.publicUrl, activo: true })
            .select()
            .single();

        if (error) {
            console.error('Error al crear película:', error);
            return false;
        }

        return await this.guardarGeneros(data.id_pelicula, idsGeneros);
    }
    async modificarPelicula(
        idPelicula: number,
        datos: Omit<Pelicula, 'id_pelicula' | 'activo' | 'funciones' | 'pelicula_generos'>,
        idsGeneros: number[],
        imagen: File | null
    ): Promise<boolean> {

        let urlPortada = datos.portada;

        if (imagen) {
            const nombreArchivo = `${Date.now()}_${imagen.name}`;

            const { error: errorSubida } = await this.supabaseService.cliente.storage
                .from('portadas')
                .upload(nombreArchivo, imagen);

            if (errorSubida) {
                console.error('Error al subir la portada:', errorSubida);
                return false;
            }

            const { data: urlData } = this.supabaseService.cliente.storage
                .from('portadas')
                .getPublicUrl(nombreArchivo);

            
            const nombreArchivoViejo = datos.portada.split('/').pop();
            if (nombreArchivoViejo) {
                await this.supabaseService.cliente.storage
                    .from('portadas')
                    .remove([nombreArchivoViejo]);
            }

            urlPortada = urlData.publicUrl;
        }

        const { error } = await this.supabaseService.cliente
            .from('peliculas')
            .update({ ...datos, portada: urlPortada })
            .eq('id_pelicula', idPelicula);

        if (error) {
            console.error('Error al modificar película:', error);
            return false;
        }

        return await this.guardarGeneros(idPelicula, idsGeneros);
    }

    async cambiarEstadoPelicula(idPelicula: number, activo: boolean): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('peliculas')
            .update({ activo })
            .eq('id_pelicula', idPelicula);

        if (error) {
            console.error('Error al cambiar estado:', error);
            return false;
        }
        return true;
    }


    private async guardarGeneros(idPelicula: number, idsGeneros: number[]): Promise<boolean> {
        const { error: errorBorrado } = await this.supabaseService.cliente
            .from('pelicula_generos')
            .delete()
            .eq('id_pelicula', idPelicula);

        if (errorBorrado) {
            console.error('Error al limpiar géneros:', errorBorrado);
            return false;
        }

        const filas = idsGeneros.map((idGenero) => ({
            id_pelicula: idPelicula,
            id_genero: idGenero,
        }));

        const { error } = await this.supabaseService.cliente
            .from('pelicula_generos')
            .insert(filas);

        if (error) {
            console.error('Error al guardar géneros:', error);
            return false;
        }
        return true;
    }

    // IGNORA  LAS HORAS, por eso el menor o IGUAL en  el return. Porque si no, si ahora son las 12 hs y tengo una funcion para las  18hs, va  a dar  false
    // Verifica si las funciones ya pasaron o  si no pasaron pero son hoy (para mandarlas al catalogo general)
    public esHoyOEsPasada(fechaHoraFuncion: string): boolean {
        const fecha = new Date(fechaHoraFuncion);
        fecha.setHours(0, 0, 0, 0);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        return fecha <= hoy;
    }

    // COMPARA LAS HORAS
    private esFuncionFutura(fechaHoraFuncion: string): boolean {
        const momentoFuncion = new Date(fechaHoraFuncion);
        const ahora = new Date();
        return ahora < momentoFuncion;
    }


    public perteneceACatalogoGeneral(pelicula: Pelicula): boolean {
        // busca si al menos  una  funcion ya  paso, o no paso pero es hoy
        return pelicula.ya_estrenada_previamente || pelicula.funciones.some((funcion: Funcion) => this.esHoyOEsPasada(funcion.fecha_hora))
    }

    public perteneceAProximamente(pelicula: Pelicula): boolean {
        // aca se asegura  que  todas las funciones sean futuras (ni pasadas ni  hoy)
        return !pelicula.ya_estrenada_previamente && ((pelicula.funciones.every((funcion: Funcion) => !this.esHoyOEsPasada(funcion.fecha_hora))) || pelicula.funciones.length == 0)
    }



    public filtrarFuncionesCatalogoGeneral(pelicula: Pelicula): Pelicula {
        if (this.perteneceACatalogoGeneral(pelicula)) {
            // Devuelve una nueva pelicula, pero solo con las funciones que todavia no pasaron, o sea las futuras
            return {
                ...pelicula,
                ya_estrenada_previamente: true,
                funciones: pelicula.funciones.filter((funcion: Funcion) => {
                    return this.esFuncionFutura(funcion.fecha_hora)
                })
            }

        }

        else {
            return pelicula
        }

    }

    public filtrarFuncionesProximamente(pelicula: Pelicula): Pelicula {
        if (this.perteneceAProximamente(pelicula)) {
            const funcionAncla = this.buscarFuncionAncla(pelicula)

            // Si no  tiene  funcion  ancla, es  porque  no  configuro  la preventa. Por eso el filtro  daria 0 funciones para preventa
            // Si tiene funcion ancla pero faltan mas de 7 dias, todavía no  se activa  la preventa (por ahora no se muestran las funciones, o sea el filtro daria 0 funciones para preventa)
            // IF PARA PROXIMAMENTE  SIN  FUNCIONES, DEVUELVE UNA PELICULA PERO CON ARRAY VACIO DE 0 FUNCIONES
            if (!funcionAncla || (this.calcularDiferenciaDias(funcionAncla.fecha_hora) > 7)) {
                return {
                    ...pelicula,
                    funciones: []
                }

            }
            // Si tiene funcion ancla y faltan menos  de 7 dias, el filtro daría todas las funciones disponibles que tengan precio preventa
            // Devuelve una  pelicula con  las funciones disponibleas que tengan precio  preventa
            else {
                return {
                    ...pelicula,
                    funciones: pelicula.funciones.filter((funcion: Funcion) => funcion.precio_preventa != null)
                }

            }
        }
        else {
            return pelicula
        }


    }


    private buscarFuncionAncla(pelicula: Pelicula): Funcion | undefined {
        return pelicula.funciones.find((funcion: Funcion) => funcion.es_funcion_ancla);
    }




    private calcularDiferenciaDias(fechaHora: string): number {
        const fecha = new Date(fechaHora)
        fecha.setHours(0, 0, 0, 0)

        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const diferenciaEnMilisegundos = fecha.getTime() - hoy.getTime()

        const milisegundosEnUnDia = (1000 * 60 * 60 * 24)
        return Math.floor(diferenciaEnMilisegundos / milisegundosEnUnDia)
    }



    public filtrarFunciones(pelicula: Pelicula): Pelicula {
        if (this.perteneceAProximamente(pelicula)) {
            return this.filtrarFuncionesProximamente(pelicula)
        }
        else if (this.perteneceACatalogoGeneral(pelicula)) {
            return this.filtrarFuncionesCatalogoGeneral(pelicula)
        }
        else {
            return pelicula
        }
    }

}


