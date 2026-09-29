import { Component } from '@angular/core';
import { CandyService } from '../../../core/services/candy-service';
import { inject, signal, OnInit, computed } from '@angular/core';
import { ProductoCandy } from '../../../core/models/productoCandyInterface';
import { CardProductoCandy } from '../../../shared/card-producto-candy/card-producto-candy';
import { CandyVendido } from '../../../core/models/candyVendidointerface';
import { Router } from '@angular/router';
import { CompraService } from '../../../core/services/compra-service';
import { CATEGORIAS_CANDY } from '../../../core/services/candy-service';
import { Header } from '../../../layout/header/header';

@Component({
  imports: [CardProductoCandy, Header],
  selector: 'app-candy-compra',
  styleUrl: './candy-compra.css',
  templateUrl: './candy-compra.html',
})
export class CandyCompra implements OnInit {
  private candyService = inject(CandyService)
  private router = inject(Router)
  private compraService = inject(CompraService)

 
  productosCandy = signal<ProductoCandy[]>([])
  listaProductosCandyCarrito = signal<CandyVendido[]>([])


  categoriasConProductosCargados = computed(() =>
    CATEGORIAS_CANDY.filter((categoria) =>
      this.productosCandy().some((producto) => producto.categoria === categoria)
    )
  )

  obtenerProductosDeCategoriaEspecifica(categoria: string): ProductoCandy[] {
    return this.productosCandy().filter((producto) => producto.categoria === categoria)
  }

  async ngOnInit() {
    this.productosCandy.set(await this.candyService.obtenerProductosCandy())
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

  navegarHaciaPago() {
    this.compraService.setearCandy(this.listaProductosCandyCarrito());
    this.router.navigate(['/comprar/pago'])

  }

}


