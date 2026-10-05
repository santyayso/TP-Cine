import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Resena } from '../models/resenaInterface';
import { ResenaConUsuario } from '../models/resenaConUsuarioInterface';

@Injectable({ providedIn: 'root' })
export class ResenasService {
    private supabaseService = inject(Supabase);

    async obtenerResenasDeUsuario(idUsuario: string): Promise<Resena[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('resenas')
            .select('*')
            .eq('id_usuario', idUsuario);

        if (error) {
            console.error('Error al traer reseñas:', error);
            return [];
        }
        return data ?? [];
    }

    async crearResena(idUsuario: string, idPelicula: number, calificacion: number, comentario: string): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('resenas')
            .insert({
                id_usuario: idUsuario,
                id_pelicula: idPelicula,
                calificacion: calificacion,
                comentario: comentario,
            });

        if (error) {
            console.error('Error al crear reseña:', error);
            return false;
        }
        return true;
    }

    async modificarResena(idUsuario: string, idPelicula: number, calificacion: number, comentario: string): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('resenas')
            .update({ calificacion, comentario })
            .eq('id_usuario', idUsuario)
            .eq('id_pelicula', idPelicula);

        if (error) {
            console.error('Error al modificar reseña:', error);
            return false;
        }
        return true;
    }

    async eliminarResena(idUsuario: string, idPelicula: number): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('resenas')
            .delete()
            .eq('id_usuario', idUsuario)
            .eq('id_pelicula', idPelicula);

        if (error) {
            console.error('Error al eliminar reseña:', error);
            return false;
        }
        return true;
    }

    async obtenerResenasDePelicula(idPelicula: number): Promise<ResenaConUsuario[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('resenas')
            .select('*, usuarios(nombre, apellido)')
            .eq('id_pelicula', idPelicula);

        if (error) {
            console.error('Error al traer reseñas de la película:', error);
            return [];
        }
        return data ?? [];
    }

}