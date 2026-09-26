export interface CandyVendido {
    id_candy_vendido: number | null,
    id_detalle_venta: number | null,
    id_producto_candy: number,
    precio_pagado: number,
    cantidad: number,
    es_canje: boolean
}