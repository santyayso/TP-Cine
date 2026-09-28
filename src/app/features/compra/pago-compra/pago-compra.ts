import { Component, OnInit } from '@angular/core';
import { signal, inject, computed } from '@angular/core';
import { CompraService } from '../../../core/services/compra-service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { ReactiveFormsModule } from '@angular/forms';
import { CuponUsuario } from '../../../core/models/cuponUsuarioInterface';
import { CuponesService } from '../../../core/services/cupones-service';
import { Cupon } from '../../../core/models/cuponInterface';
import { Router } from '@angular/router';

@Component({
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  selector: 'app-pago-compra',
  styleUrl: './pago-compra.css',
  templateUrl: './pago-compra.html',
})
export class PagoCompra implements OnInit {
  public compraService = inject(CompraService)
  public authService = inject(AuthService)
  private cuponesService = inject(CuponesService)
  private router = inject(Router)

  totalButacas = signal<number>(0)
  totalCandy = signal<number>(0)
  creditoIngresado = signal<number>(0)
  cuponesDisponibles = signal<CuponUsuario[]>([]);


  async ngOnInit() {
    this.totalButacas.set(this.compraService.calcularTotalButacas(this.compraService.butacasSeleccionadas()))
    this.totalCandy.set(this.compraService.listaCandyVendidos().reduce((acumulador: number, producto) => acumulador + producto.precio_pagado, 0))

    const usuario = this.authService.currentUserData();
    if (usuario) {
      const cupones = await this.cuponesService.obtenerCuponesDisponiblesDe(usuario.id);
      this.cuponesDisponibles.set(cupones);
    }


  }

  total = computed(() => {
    return this.totalButacas() + this.totalCandy()
  })

  creditoDisponible = computed(() => {
    return this.authService.currentUserData()?.creditos_disponibles ?? 0;
  })

  montoEfectivo = computed(() => {
    return this.totalConCupon() - this.creditoIngresado()
  })

  setearCreditoIngresado(valorTexto: string) {
    const numero = Number(valorTexto)
    this.creditoIngresado.set(numero)
  }

  errorCredito = computed(() => {
    const valor = this.creditoIngresado();

    if (valor < 0) {
      return 'El monto no puede ser negativo';
    }
    if (valor > this.creditoDisponible()) {
      return 'Estas excediendo la cantidad de creditos que tenes disponibles';
    }
    if (valor > this.totalConCupon()) {
      return 'Estas ingresando un monto mayor al total';
    }
    return null
  })


  cuponUsuarioSeleccionado = signal<CuponUsuario | null>(null);
  cuponSeleccionado = signal<Cupon | null>(null);


  totalConCupon = computed(() => {
    const cupon = this.cuponSeleccionado();
    if (!cupon) return this.total();

    return this.total() - ((cupon.porcentaje * this.total()) / 100);
  });

  aplicarCupon(cupon: CuponUsuario | null) {
    this.cuponUsuarioSeleccionado.set(cupon)
    this.cuponSeleccionado.set(cupon?.cupones ?? null);
  }




  async confirmarCompra() {
    const error = this.errorCredito()
    if (error) {
      alert(error);
      return;
    }


    await this.compraService.generarCompra(
      this.montoEfectivo(),
      this.totalConCupon(),
      this.creditoIngresado(),
      this.cuponSeleccionado()?.id_cupon ?? null,
      this.cuponUsuarioSeleccionado()?.id_cupon_usuario ?? null
    )
    
    this.router.navigate(['comprar/pdf'])

  }


}
