import { Component, OnInit } from '@angular/core';
import { ButacasService } from '../../../core/services/butacas-service';
import { inject, signal, computed } from '@angular/core';
import { ButacaGenerada } from '../../../core/models/butacaGeneradaInterface';
import { CompraService } from '../../../core/services/compra-service';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
import { RealtimeChannel } from '@supabase/supabase-js';
@Component({
  imports: [CurrencyPipe, Header, Footer],
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




  estaSeleccionada(butacaSeleccionada: ButacaGenerada) {
    return this.butacasSeleccionadas().some((butaca) => butaca.fila == butacaSeleccionada.fila && butaca.numero == butacaSeleccionada.numero)
  }

  butacasRestantesAseleccionar = computed(() => {
    return this.compraService.cantidadEntradas() - this.butacasSeleccionadas().length
  })

  alternarButaca(butacaSeleccionada: ButacaGenerada) {

    if (this.estaOcupada(butacaSeleccionada)) {
      return
    }

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

  butacasOcupadas = signal<{ fila: string; numero: number }[]>([])
  private canal?: RealtimeChannel

  async ngOnInit() {
    this.matrizButacas.set(this.butacasService.generarMatrizButacas())

    const funcion = this.compraService.funcionSeleccionada()
    if (!funcion) {
      return
    }

    await this.recargarButacasOcupadas(funcion.id_funcion)

    this.canal = this.butacasService.escucharCambiosDeButacas(
      funcion.id_funcion,
      () => this.recargarButacasOcupadas(funcion.id_funcion)
    )
  }

  ngOnDestroy() {
    if (this.canal) {
      this.butacasService.dejarDeEscuchar(this.canal)
    }
  }

  async recargarButacasOcupadas(idFuncion: number) {
    this.butacasOcupadas.set(await this.butacasService.obtenerButacasOcupadas(idFuncion))

    const cantidadAntes = this.butacasSeleccionadas().length
    this.butacasSeleccionadas.update((lista) => lista.filter((butaca) => !this.estaOcupada(butaca)))

    if (this.butacasSeleccionadas().length < cantidadAntes) {
      alert('Alguna de las butacas que elegiste acaba de ser comprada por otra persona. Elegí otra.')
    }
  }

  estaOcupada(butacaConsultada: ButacaGenerada) {
    return this.butacasOcupadas().some((ocupada) => ocupada.fila == butacaConsultada.fila && ocupada.numero == butacaConsultada.numero)
  }


}
