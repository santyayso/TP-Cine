import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Sala } from '../models/salaInterface';

@Injectable({ providedIn: 'root' })
export class SalasService {
    private supabaseService = inject(Supabase);

    // trae TODAS las salas (activas e inactivas) para la tabla del admin
    async obtenerSalasAdmin(): Promise<Sala[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('salas')
            .select('*')
            .order('id_sala');

        if (error) {
            console.error('Error al traer salas (admin):', error);
            return [];
        }
        return data ?? [];
    }


    async crearSala(nombre: string): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('salas')
            .insert({ nombre: nombre, activo: true });

        if (error) {
            console.error('Error al crear sala:', error);
            return false;
        }
        return true;
    }


    async modificarSala(idSala: number, nombre: string): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('salas')
            .update({ nombre: nombre })
            .eq('id_sala', idSala);

        if (error) {
            console.error('Error al modificar sala:', error);
            return false;
        }
        return true;
    }


    async cambiarEstadoSala(idSala: number, activo: boolean): Promise<boolean> {
        const { error } = await this.supabaseService.cliente
            .from('salas')
            .update({ activo: activo })
            .eq('id_sala', idSala);

        if (error) {
            console.error('Error al cambiar estado de la sala:', error);
            return false;
        }
        return true;
    }


    // solo miramos las funciones FUTURAS: las que ya pasaron son historial y no deberían impedir la baja
    async tieneFuncionesFuturas(idSala: number): Promise<boolean> {
        const { data, error } = await this.supabaseService.cliente
            .from('funciones')
            .select('id_funcion')
            .eq('id_sala', idSala)
            .gt('fecha_hora', new Date().toISOString());

        if (error) {
            console.error('Error al verificar funciones de la sala:', error);
            // ante la duda, no dejamos dar de baja
            return true;
        }

        return data.length > 0;
    }

    async obtenerNombreSala(idSala: number): Promise<string> {
        const { data, error } = await this.supabaseService.cliente
            .from('salas')
            .select('nombre')
            .eq('id_sala', idSala)
            .single();

        if (error) {
            console.error('Error al traer el nombre de la sala:', error);
            return '';
        }

        return data.nombre;
    }

}