import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Usuario, RolUsuario } from '../models/usuariointerface';
import { LogService } from './log-service';

export const ROLES: RolUsuario[] = ['usuario', 'empleado', 'admin'];

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {

  private supabaseService = inject(Supabase);
  private logService = inject(LogService);


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

    await this.logService.registrar('Cambió rol de usuario', `Usuario ${idUsuario} ahora es ${rol}`);

    return true;
  }

}