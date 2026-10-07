import { Injectable } from '@angular/core';
import { ProductoCandy, CategoriaCandy } from '../models/productoCandyInterface';
import { Supabase } from './supabase';
import { LogService } from './log-service';
import { inject } from '@angular/core';
import { signal } from '@angular/core';

export const CATEGORIAS_CANDY: CategoriaCandy[] = ['Pochoclos', 'Bebidas', 'Golosinas', 'Snacks'];


@Injectable({
  providedIn: 'root',
})
export class CandyService {

  private supabaseService = inject(Supabase);
  private logService = inject(LogService);


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


async crearProducto(datos: Omit<ProductoCandy, 'id_producto_candy' | 'activo'>, imagen: File): Promise<boolean> {
    const nombreArchivo = `${Date.now()}_${imagen.name}`;

    const { error: errorSubida } = await this.supabaseService.cliente.storage
        .from('candy')
        .upload(nombreArchivo, imagen);

    if (errorSubida) {
        console.error('Error al subir la imagen:', errorSubida);
        return false;
    }

    const { data: urlData } = this.supabaseService.cliente.storage
        .from('candy')
        .getPublicUrl(nombreArchivo);

    const { error } = await this.supabaseService.cliente
        .from('productos_candy')
        .insert({ ...datos, imagen: urlData.publicUrl, activo: true });

    if (error) {
        console.error('Error al crear producto:', error);
        return false;
    }

    await this.logService.registrar('Creó producto de candy', `"${datos.nombre}"`);

    return true;
}

async modificarProducto(idProducto: number, datos: Omit<ProductoCandy, 'id_producto_candy' | 'activo'>, imagen: File | null): Promise<boolean> {
    let urlImagen = datos.imagen;

    if (imagen) {
        const nombreArchivo = `${Date.now()}_${imagen.name}`;

        const { error: errorSubida } = await this.supabaseService.cliente.storage
            .from('candy')
            .upload(nombreArchivo, imagen);

        if (errorSubida) {
            console.error('Error al subir la imagen:', errorSubida);
            return false;
        }

        const { data: urlData } = this.supabaseService.cliente.storage
            .from('candy')
            .getPublicUrl(nombreArchivo);

        const nombreArchivoViejo = datos.imagen.split('/').pop();
        if (nombreArchivoViejo) {
            await this.supabaseService.cliente.storage
                .from('candy')
                .remove([nombreArchivoViejo]);
        }

        urlImagen = urlData.publicUrl;
    }

    const { error } = await this.supabaseService.cliente
        .from('productos_candy')
        .update({ ...datos, imagen: urlImagen })
        .eq('id_producto_candy', idProducto);

    if (error) {
        console.error('Error al modificar producto:', error);
        return false;
    }

    await this.logService.registrar('Modificó producto de candy', `"${datos.nombre}" (id ${idProducto})`);

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

    await this.logService.registrar(activo ? 'Reactivó producto de candy' : 'Dio de baja producto de candy', `Producto id ${idProducto}`);

    return true;
  }


}