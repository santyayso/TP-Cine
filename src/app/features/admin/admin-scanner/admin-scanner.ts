import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';
import { ScannerService } from '../../../core/services/scanner-service';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';

@Component({
  imports: [DatePipe, Header, Footer],
  selector: 'app-admin-scanner',
  styleUrl: './admin-scanner.css',
  templateUrl: './admin-scanner.html',
})
export class AdminScanner implements OnDestroy {
  private scannerService = inject(ScannerService)

  // el objeto de la libreria que maneja la camara
  private escaner: Html5Qrcode | null = null

  // la cámara lee el mismo QR muchas veces por segundo, esto hace que solo procesemos la primera lectura
  private procesandoCodigo = false

  escaneando = signal<boolean>(false)
  mensajeCamara = signal<string>('')
  mensajeError = signal<string>('')
  mensajeExito = signal<string>('')

  // el detalle_venta que se encontró con el QR (con la venta, función, butacas y candy adentro)
  detalle = signal<any | null>(null)


  // =====================
  // CAMARA
  // =====================

  // sirve tanto para "Activar cámara" como para "Escanear otro código"
  async activarCamara() {
    this.detalle.set(null)
    this.mensajeError.set('')
    this.mensajeExito.set('')
    this.mensajeCamara.set('')
    this.procesandoCodigo = false

    try {
      if (!this.escaner) {
        // 'lector-qr' es el id del div del html, o sea donde se dibuja la camara
        this.escaner = new Html5Qrcode('lector-qr')
      }

      await this.escaner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (codigoLeido) => this.alLeerCodigo(codigoLeido), // lo  que hace cuando se lee el codigo
        () => { } // se llama cuando un frame no tiene QR (pasa todo el tiempo), lo ignoramos
      )

      this.escaneando.set(true)
    }
    catch (error) {
      console.error('Error al iniciar la camara:', error)
      this.mensajeCamara.set('No se pudo abrir la cámara.')
    }
  }


  async apagarCamara() {
    if (this.escaner && this.escaneando()) {
      await this.escaner.stop()
      this.escaneando.set(false)
    }
  }


  ngOnDestroy() {
    // si salimos de la pantalla con la cámara prendida, la apagamos
    this.apagarCamara()
  }


  // =====================
  // LECTURA DEL CODIGO
  // =====================

  // la usa la camara, y tambien el input manual 
  async buscarCodigoManual(codigo: string) {
    if (codigo.trim() == '') {
      return
    }

    this.procesandoCodigo = false
    await this.alLeerCodigo(codigo)
  }


  async alLeerCodigo(codigo: string) {
    if (this.procesandoCodigo) {
      return
    }
    this.procesandoCodigo = true

    await this.apagarCamara()

    this.detalle.set(null)
    this.mensajeError.set('')
    this.mensajeExito.set('')

    const detalleEncontrado = await this.scannerService.obtenerDetallePorCodigoQr(codigo.trim())

    if (!detalleEncontrado) {
      this.mensajeError.set('Código QR no encontrado')
      return
    }

    if (detalleEncontrado.ventas.estado !== 'activa') {
      this.mensajeError.set('Esta compra fue cancelada, no se puede validar')
      return
    }

    this.detalle.set(detalleEncontrado)
  }


  // =====================
  // QUE SE PUEDE VALIDAR (cada computed devuelve el motivo por el que NO se puede, o '' si se puede)
  // =====================

  // si la compra tiene función, tiene que ser de hoy (una compra solo de candy no tiene función)
  motivoFechaInvalida = computed(() => {
    const funcion = this.detalle()?.funciones

    if (!funcion) {
      return ''
    }

    if (new Date(funcion.fecha_hora).toDateString() !== new Date().toDateString()) {
      return `La función es el ${formatDate(new Date(funcion.fecha_hora), 'dd/MM/yyyy', 'en-US')}, no es de hoy`
    }

    return ''
  })


  motivoEntradaNoValidable = computed(() => {
    const detalle = this.detalle()

    if (!detalle) {
      return ''
    }

    if (detalle.butacas_vendidas.length === 0) {
      return 'Esta compra no incluye entradas'
    }

    if (detalle.validacion_entrada) {
      return 'La entrada ya fue validada'
    }

    return this.motivoFechaInvalida()
  })


  motivoCandyNoValidable = computed(() => {
    const detalle = this.detalle()

    if (!detalle) {
      return ''
    }

    if (detalle.candy_vendidos.length === 0) {
      return 'Esta compra no incluye candy'
    }

    if (detalle.validacion_candy) {
      return 'El candy ya fue validado'
    }

    return this.motivoFechaInvalida()
  })


  // =====================
  // VALIDAR
  // =====================

  async validar(tipo: 'entrada' | 'candy') {
    const detalle = this.detalle()
    if (!detalle) {
      return
    }

    this.mensajeError.set('')
    this.mensajeExito.set('')

    const verificacionSupaBase = await this.scannerService.marcarComoValidado(detalle.id_detalle_venta, tipo)

    if (!verificacionSupaBase) {
      // lo más probable es que otro scanner la haya validado justo antes, volvemos a traerla para mostrar el estado real
      this.mensajeError.set('No se pudo validar: puede que ya estuviera validada.')
      this.detalle.set(await this.scannerService.obtenerDetallePorCodigoQr(detalle.codigo_qr))
      return
    }

    // reflejamos el cambio en pantalla sin volver a consultar
    const campo = tipo === 'entrada' ? 'validacion_entrada' : 'validacion_candy'
    this.detalle.update((actual) => ({ ...actual, [campo]: true }))

    if (tipo === 'entrada') {
      this.mensajeExito.set('Entrada validada correctamente')
    } else {
      this.mensajeExito.set('Candy validado correctamente')
    }
  }
}