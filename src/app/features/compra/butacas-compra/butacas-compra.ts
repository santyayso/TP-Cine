import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { ButacasService } from '../../../core/services/butacas-service';
import { inject, signal, computed } from '@angular/core';
import { ButacaGenerada } from '../../../core/models/butacaGeneradaInterface';
import { CompraService } from '../../../core/services/compra-service';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
@Component({
  imports: [CurrencyPipe, Header, Footer],
  selector: 'app-butacas-compra',
  styleUrl: './butacas-compra.css',
  templateUrl: './butacas-compra.html',
})

export class ButacasCompra implements OnInit, OnDestroy {
  compraService = inject(CompraService)
  router = inject(Router)
  private butacasService = inject(ButacasService)
  matrizButacas = signal<ButacaGenerada[][][]>([])
  butacasSeleccionadas = signal<ButacaGenerada[]>([])

  // viene del service: se actualiza solo con el realtime
  butacasOcupadas = this.butacasService.butacasOcupadas

  constructor() {
    // cada vez que cambian las ocupadas, saco las que yo había elegido y alguien me ganó
    effect(() => {
      this.butacasOcupadas()

      const antes = this.butacasSeleccionadas()
      const quedan = antes.filter((butaca) => !this.estaOcupada(butaca))

      if (quedan.length < antes.length) {
        this.butacasSeleccionadas.set(quedan)
        alert('Alguna de las butacas que elegiste acaba de ser comprada por otra persona. Elegí otra.')
      }
    })
  }

  estaSeleccionada(butacaSeleccionada: ButacaGenerada) {
    return this.butacasSeleccionadas().some((butaca) => butaca.fila == butacaSeleccionada.fila && butaca.numero == butacaSeleccionada.numero)
  }


  alternarButaca(butacaSeleccionada: ButacaGenerada) {

    if (this.estaOcupada(butacaSeleccionada)) {
      return
    }

    const verifiCacionSeleccionada = this.estaSeleccionada(butacaSeleccionada)

    if (verifiCacionSeleccionada == false) {
      this.butacasSeleccionadas.update((listaActual) => {
        return [...listaActual, butacaSeleccionada];
      })
    }
    else {
      this.butacasSeleccionadas.update((listaActual) => {
        return listaActual.filter((butaca) => !(butaca.fila == butacaSeleccionada.fila && butaca.numero == butacaSeleccionada.numero))
      })
    }

  }

  navegarHaciaCandy() {
    if (this.butacasSeleccionadas().length == 0) {
      alert('Seleccioná al menos una butaca')
      return
    }

    this.compraService.setearButacas(this.butacasSeleccionadas())
    this.router.navigate(['comprar/candy'])
  }

  async ngOnInit() {
    this.matrizButacas.set(this.butacasService.generarMatrizButacas())

    const funcion = this.compraService.funcionSeleccionada()
    if (!funcion) {
      return
    }

    await this.butacasService.escucharButacasDeFuncion(funcion.id_funcion)
  }

  ngOnDestroy() {
    this.butacasService.dejarDeEscuchar()
  }

  estaOcupada(butacaConsultada: ButacaGenerada) {
    return this.butacasOcupadas().some((ocupada) => ocupada.fila_butaca == butacaConsultada.fila && ocupada.numero_butaca == butacaConsultada.numero)
  }

}