import { Component, OnInit } from '@angular/core';
import { ButacasService } from '../../../core/services/butacas-service';
import { inject, signal, computed } from '@angular/core';
import { ButacaGenerada } from '../../../core/models/butacaGeneradaInterface';
import { CompraService } from '../../../core/services/compra-service';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../../layout/header/header';
@Component({
  imports: [CurrencyPipe, Header],
  selector: 'app-butacas-compra',
  styleUrl: './butacas-compra.css',
  templateUrl: './butacas-compra.html',
})

export class ButacasCompra implements OnInit {
  compraService = inject(CompraService)
  router = inject(Router)
  private butacasService = inject(ButacasService)
  matrizButacas = signal<ButacaGenerada[][][]>([])
  butacasSeleccionadas = signal<ButacaGenerada[]>([])


  ngOnInit() {
    this.matrizButacas.set(this.butacasService.generarMatrizButacas())

  }

  estaSeleccionada(butacaSeleccionada: ButacaGenerada) {
    return this.butacasSeleccionadas().some((butaca) => butaca.fila == butacaSeleccionada.fila && butaca.numero == butacaSeleccionada.numero)
  }

  butacasRestantesAseleccionar = computed(() => {
    return this.compraService.cantidadEntradas() - this.butacasSeleccionadas().length
  })

  alternarButaca(butacaSeleccionada: ButacaGenerada) {
    const verifiCacionSeleccionada = this.estaSeleccionada(butacaSeleccionada)

    if (verifiCacionSeleccionada == false) {
      if (this.butacasRestantesAseleccionar() == 0) {
        alert(`Usted ya eligió la cantidad de butacas correspondientes a la cantidad de entradas que seleccionó (${this.compraService.cantidadEntradas()})`)
      }
      else {
        this.butacasSeleccionadas.update((listaActual) => {
          return [...listaActual, butacaSeleccionada];
        })
      }

    }
    else {
      this.butacasSeleccionadas.update((listaActual) => {
        return listaActual.filter((butaca) => !(butaca.fila == butacaSeleccionada.fila && butaca.numero == butacaSeleccionada.numero))
      })
    }


  }

  navegarHaciaCandy() {
    if (this.butacasRestantesAseleccionar() > 0) {
      alert(`Usted no eligió la cantidad de butacas correspondientes a la cantidad de entradas que seleccionó (${this.compraService.cantidadEntradas()})`)
    }
    else {
      this.compraService.setearButacas(this.butacasSeleccionadas())

      this.router.navigate(['comprar/candy'])
    }




  }


}
