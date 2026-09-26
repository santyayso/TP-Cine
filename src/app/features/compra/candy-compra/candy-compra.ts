import { Component } from '@angular/core';
import { CandyService } from '../../../core/services/candy-service';
import { inject, signal, OnInit } from '@angular/core';
import { ProductoCandy } from '../../../core/models/productoCandyInterface';
import { CardProductoCandy } from '../../../shared/card-producto-candy/card-producto-candy';
import { CandyVendido } from '../../../core/models/candyVendidointerface';
import { Router } from '@angular/router';
import { CompraService } from '../../../core/services/compra-service';

@Component({
  imports: [CardProductoCandy],
  selector: 'app-candy-compra',
  styleUrl: './candy-compra.css',
  templateUrl: './candy-compra.html',
})
export class CandyCompra implements OnInit {
  private candyService = inject(CandyService)
  private router = inject(Router)
  private compraService = inject(CompraService) 

  categoriasProductos = signal<string[]>([])
  productosCandy = signal<ProductoCandy[]>([])
  listaProductosCandyCarrito = signal<CandyVendido[]>([])

  async ngOnInit() {
    const data = await this.candyService.obtenerProductosCandy();
    this.productosCandy.set(data)

    const categorias = await this.candyService.obtenerCategoriasUnicas();
    this.categoriasProductos.set(categorias)

  }

  modificarCarrito(productoCandyCarrito: CandyVendido) {
    this.listaProductosCandyCarrito.update((listaActual) => {
      const listaSinEseProducto = listaActual.filter(
        (producto) => producto.id_producto_candy !== productoCandyCarrito.id_producto_candy
      );

      if (productoCandyCarrito.cantidad === 0) {
        return listaSinEseProducto;
      }

      return [...listaSinEseProducto, productoCandyCarrito];
    });
  }

  navegarHaciaButacas(){
    this.compraService.setearCandy(this.listaProductosCandyCarrito());
    this.router.navigate(['/comprar/butacas'])

  }

}


