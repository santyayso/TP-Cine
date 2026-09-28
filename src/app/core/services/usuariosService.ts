import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Usuario, RolUsuario } from '../models/usuariointerface';

export const ROLES: RolUsuario[] = ['usuario', 'empleado', 'admin'];

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {

  private supabaseService = inject(Supabase);


  async obtenerTodosLosUsuarios(): Promise<Usuario[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('usuarios')
      .select('*')
      .order('apellido');

    if (error) {
      console.error('Error al traer usuarios (admin):', error);
      return [];
    }
    return data ?? [];
  }


  async cambiarRolUsuario(idUsuario: string, rol: RolUsuario): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('usuarios')
      .update({ rol })
      .eq('id', idUsuario);

    if (error) {
      console.error('Error al cambiar rol:', error);
      return false;
    }
    return true;
  }

}