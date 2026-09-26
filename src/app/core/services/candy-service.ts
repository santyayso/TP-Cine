import { Injectable } from '@angular/core';
import { ProductoCandy } from '../models/productoCandyInterface';
import { Supabase } from './supabase';
import { inject } from '@angular/core';
import { signal } from '@angular/core';

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


    async obtenerCategoriasUnicas(): Promise<string[]> {
        const { data, error } = await this.supabaseService.cliente
            .from('productos_candy')
            .select('categoria');

        if (error) {
            console.error('Error:', error);
            return [];
        }

        const categorias = data.map((producto: any) => producto.categoria);

        const categoriasUnicas = categorias.reduce((categoriasAcumuladas: string[], categoriaActual: string) => {
            if (!categoriasAcumuladas.includes(categoriaActual)) {
                categoriasAcumuladas.push(categoriaActual);
            }
            return categoriasAcumuladas;
        }, []);

        return categoriasUnicas;
    }

}


