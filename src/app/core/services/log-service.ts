import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class LogService {
  private supabaseService = inject(Supabase);
  private authService = inject(AuthService);

  async registrar(accion: string, detalle: string): Promise<void> {
    const idUsuario = this.authService.currentUserData()?.id;
    if (!idUsuario) {
      return;
    }

    const { error } = await this.supabaseService.cliente
      .from('log_actividad')
      .insert({ id_usuario: idUsuario, accion, detalle });

    if (error) {
      console.error('Error al registrar en el log:', error);
    }
  }

  async obtenerLog(): Promise<any[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('log_actividad')
      .select('*, usuarios(nombre, apellido)')
      .order('fecha', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error al traer el log:', error);
      return [];
    }
    return data ?? [];
  }
}