import { Injectable } from '@angular/core';
import { ProductoCandy, CategoriaCandy } from '../models/productoCandyInterface';
import { Supabase } from './supabase';
import { inject } from '@angular/core';
import { signal } from '@angular/core';

export const CATEGORIAS_CANDY: CategoriaCandy[] = ['Pochoclos', 'Bebidas', 'Golosinas', 'Snacks'];


@Injectable({
  providedIn: 'root',
})
export class CandyService {

  private supabaseService = inject(Supabase);


  async obtenerProductosCandy(): Promise<ProductoCandy[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('productos_candy')
      .select('*')
      .eq('activo', true);

    if (error) {
      console.error('Error al traer productos de candy:', error);
      return [];
    }

    return data ?? [];
  }




  async obtenerProductosAdmin(): Promise<ProductoCandy[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('productos_candy')
      .select('*')
      .order('id_producto_candy');

    if (error) {
      console.error('Error al traer productos (admin):', error);
      return [];
    }
    return data ?? [];
  }


  async crearProducto(datos: Omit<ProductoCandy, 'id_producto_candy' | 'activo'>): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('productos_candy')
      .insert({ ...datos, activo: true });

    if (error) {
      console.error('Error al crear producto:', error);
      return false;
    }
    return true;
  }

  async modificarProducto(idProducto: number, datos: Omit<ProductoCandy, 'id_producto_candy' | 'activo'>): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('productos_candy')
      .update(datos)
      .eq('id_producto_candy', idProducto);

    if (error) {
      console.error('Error al modificar producto:', error);
      return false;
    }
    return true;
  }

  async cambiarEstadoProducto(idProducto: number, activo: boolean): Promise<boolean> {
    const { error } = await this.supabaseService.cliente
      .from('productos_candy')
      .update({ activo })
      .eq('id_producto_candy', idProducto);

    if (error) {
      console.error('Error al cambiar estado:', error);
      return false;
    }
    return true;
  }


}


