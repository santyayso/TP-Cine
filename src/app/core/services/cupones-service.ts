import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { CuponUsuario } from '../models/cuponUsuarioInterface';

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private supabaseService = inject(Supabase);

  async obtenerCuponesDisponiblesDe(idUsuario: string): Promise<CuponUsuario[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('cupones_usuario')
      .select('*, cupones(*)')
      .eq('id_usuario', idUsuario)
      .eq('usado', false);

    if (error) {
      console.error('Error al traer cupones:', error);
      return [];
    }

    return data;
  }

  async marcarCuponComoUsado(idCuponUsuario: number): Promise<void> {
    const { error } = await this.supabaseService.cliente
      .from('cupones_usuario')
      .update({ usado: true })
      .eq('id_cupon_usuario', idCuponUsuario);

    if (error) {
      console.error('Error al marcar cupón como usado:', error);
    }
  }
  



//   async otorgarCuponAUsuario(idUsuario: string, idCupon: number): Promise<void> {
//     const { error } = await this.supabaseService.cliente
//       .from('cupones_usuario')
//       .insert({ id_usuario: idUsuario, id_cupon: idCupon });

//     if (error) {
//       console.error('Error al otorgar cupón:', error);
//     }
//   }
}