import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { CuponUsuario } from '../models/cuponUsuarioInterface';
import { Cupon } from '../models/cuponInterface';
import { LogService } from './log-service';

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private supabaseService = inject(Supabase);
  private logService = inject(LogService);

  async obtenerCuponesActivos(): Promise<Cupon[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('cupones')
      .select('*')
      .eq('activo', true);

    if (error) return [];
    return data ?? [];
  }

  async otorgarCuponAUsuario(idUsuario: string, idCupon: number): Promise<void> {
    const { error } = await this.supabaseService.cliente
      .from('cupones_usuario')
      .insert({ id_usuario: idUsuario, id_cupon: idCupon });

    if (error) {
      console.error('Error al otorgar cupón:', error);
    }
  }


  async otorgarCuponesAlRegistrarse(idUsuario: string, fechaNacimiento: string) {
    const cupones = await this.obtenerCuponesActivos();

    for (const cupon of cupones) {
      if (cupon.edad_minima == null) {
        await this.otorgarCuponAUsuario(idUsuario, cupon.id_cupon);
      } else {
        const edad = this.calcularEdad(fechaNacimiento);
        if (edad >= cupon.edad_minima) {
          await this.otorgarCuponAUsuario(idUsuario, cupon.id_cupon);
        }
      }
    }
  }

  private calcularEdad(fechaNacimiento: string): number {
    const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
    const nacimiento = new Date(anio, mes - 1, dia) //  para que por ejemplo abril sea 3 y no 4 (asi lo espera el date)
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    let todaviaNoCumplio = false

    if (hoy.getMonth() < nacimiento.getMonth() || hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate()) {
      todaviaNoCumplio = true
    }


    if (todaviaNoCumplio) edad--;
    return edad;
  }

  async otorgarCuponATodosLosUsuariosExistentes(cupon: Cupon): Promise<void> {
    const { data: usuarios } = await this.supabaseService.cliente
      .from('usuarios')
      .select('id, fecha_nacimiento');

    for (const usuario of usuarios ?? []) {
      if (cupon.edad_minima != null) {
        const edad = this.calcularEdad(usuario.fecha_nacimiento);
        if (edad < cupon.edad_minima) continue;
      }
      await this.otorgarCuponAUsuario(usuario.id, cupon.id_cupon);
    }
  }

  async obtenerCuponesDisponiblesDe(idUsuario: string): Promise<CuponUsuario[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('cupones_usuario')
      .select('*, cupones(*)')
      .eq('id_usuario', idUsuario)
      .eq('usado', false)
      
    if (error) return [];

    return (data ?? []).filter((cuponUsuario: any) => cuponUsuario.cupones?.activo === true);
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


  async obtenerCuponesAdmin(): Promise<Cupon[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('cupones')
      .select('*')
      .order('id_cupon');

    if (error) {
      console.error('Error al traer cupones (admin):', error);
      return [];
    }
    return data ?? [];
  }

  async crearCupon(datos: Omit<Cupon, 'id_cupon' | 'activo'>): Promise<Cupon | null> {
    const { data, error } = await this.supabaseService.cliente
      .from('cupones')
      .insert({ ...datos, activo: true })
      .select()
      .single();

    if (error) {
      console.error('Error al crear cupón:', error);
      return null;
    }

    await this.logService.registrar('Creó cupón', `"${datos.nombre}" (${datos.porcentaje}%)`);

    return data;
  }

  async modificarCupon(idCupon: number, nombre: string, porcentaje: number): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('cupones')
      .update({ nombre, porcentaje })
      .eq('id_cupon', idCupon);

    if (error) {
      console.error('Error al modificar cupón:', error);
      return false;
    }

    await this.logService.registrar('Modificó cupón', `"${nombre}" (${porcentaje}%) (id ${idCupon})`);

    return true;
  }

  async cambiarEstadoCupon(idCupon: number, activo: boolean): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('cupones')
      .update({ activo })
      .eq('id_cupon', idCupon);

    if (error) {
      console.error('Error al cambiar estado:', error);
      return false;
    }

    await this.logService.registrar(activo ? 'Reactivó cupón' : 'Dio de baja cupón', `Cupón id ${idCupon}`);

    return true;
  }




}