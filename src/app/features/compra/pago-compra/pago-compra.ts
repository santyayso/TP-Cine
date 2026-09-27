import { Component, OnInit } from '@angular/core';
import { signal, inject } from '@angular/core';
import { CompraService } from '../../../core/services/compra-service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-pago-compra',
  styleUrl: './pago-compra.css',
  templateUrl: './pago-compra.html',
})
export class PagoCompra implements OnInit {
  public compraService = inject(CompraService)


  // funcion = signal<Funcion | null>(null)
  // pelicula = signal<Pelicula | null>(null)
  // listaCandyVendidos = signal<CandyVendido[]>([]);
  // butacas = signal<ButacaGenerada[]>([]);
  // cantidadEntradas = signal<number>(0)
  totalButacas = signal<number>(0)
  totalCandy = signal<number>(0)

  async ngOnInit() {
    // this.funcion.set(this.compraService.funcionSeleccionada())
    // this.pelicula.set(this.compraService.peliculaSeleccionada())
    // this.listaCandyVendidos.set(this.compraService.listaCandyVendidos())
    // this.butacas.set(this.compraService.butacasSeleccionadas())
    // this.cantidadEntradas.set(this.compraService.cantidadEntradas())
    this.totalButacas.set(this.compraService.calcularTotalButacas(this.compraService.butacasSeleccionadas()))
    this.totalCandy.set(this.compraService.listaCandyVendidos().reduce((acumulador, producto) => acumulador + producto.precio_pagado, 0))


  }




}
