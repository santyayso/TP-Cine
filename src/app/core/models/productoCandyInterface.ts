export type CategoriaCandy = 'Pochoclos' | 'Bebidas' | 'Golosinas'  | 'Snacks'

export interface ProductoCandy {
    id_producto_candy: number,
    nombre: string,
    categoria: CategoriaCandy,
    precio: number,
    puntos: number | null,
    imagen: string,
    activo: boolean
}
