import { Component, output } from '@angular/core';
import { input, signal, effect } from '@angular/core';
import { ProductoCandy } from '../../core/models/productoCandyInterface';
import { CandyVendido } from '../../core/models/candyVendidointerface';

@Component({
  imports: [],
  selector: 'app-card-producto-candy',
  styleUrl: './card-producto-candy.css',
  templateUrl: './card-producto-candy.html',
})
export class CardProductoCandy {

  productoCandy = input.required<ProductoCandy>()

  productoCandyCarrito = signal<CandyVendido>({
    id_candy_vendido: null,
    id_detalle_venta: null,
    id_producto_candy: 0,
    precio_pagado: 0,
    cantidad: 0,
    es_canje: false
  })

  constructor() {
    effect(() => {
      this.productoCandyCarrito.update((actual) => ({
        ...actual,
        id_producto_candy: this.productoCandy().id_producto_candy
      }));
    });
  }

  outputModificarCarrito = output<CandyVendido>()

  restarCantidad() {
    if (this.productoCandyCarrito().cantidad == 0) {
      return
    }
    else {
      this.productoCandyCarrito.update((actual) => ({
        ...actual,
        cantidad: actual.cantidad - 1,
        precio_pagado: this.productoCandy().precio * (actual.cantidad - 1)
      }));
    }
  }

  sumarCantidad() {
    this.productoCandyCarrito.update((actual) => ({
      ...actual,
      cantidad: actual.cantidad + 1,
      precio_pagado: this.productoCandy().precio * (actual.cantidad + 1)
    }));
    this.outputModificarCarrito.emit(this.productoCandyCarrito())
  }


}
