import { Component, input, inject, signal, OnInit, computed, effect } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas-service';
import { DatePipe } from '@angular/common';
import { Pelicula } from '../../core/models/peliculaInterface';
import { Funcion } from '../../core/models/funcionInterface';
import { CompraService } from '../../core/services/compra-service';
import { Router } from '@angular/router';

@Component({
  imports: [DatePipe],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle-pelicula.css',
  templateUrl: './detalle-pelicula.html',
})
export class DetallePelicula implements OnInit {

  private peliculasService = inject(PeliculasService);
  private compraService = inject(CompraService)
  private router = inject(Router);

  id = input.required<string>()
  pelicula = signal<Pelicula | null>(null)
  funciones = signal<Funcion[]>([])
  cantidadEntradas = signal<number>(1)
  esProximamente = signal<boolean>(false);

  async ngOnInit() {
    const pelicula = await this.peliculasService.obtenerPeliculaPorId(this.id())

    if (!pelicula) return

    this.esProximamente.set(this.peliculasService.perteneceAProximamente(pelicula))

    const peliculaProcesada = this.peliculasService.filtrarFunciones(pelicula)
    this.pelicula.set(peliculaProcesada)
    this.funciones.set(peliculaProcesada.funciones)

    if (this.funciones().length != 0){
      const fechas = this.fechaFunciones()
      this.setearFechaSeleccionada(fechas[0])
    }

  }


  fechaFunciones = computed(() => {
    return this.funciones().reduce((acumulacionFechas: string[], funcion: Funcion) => {
      const fechaFuncionActual = new Date(funcion.fecha_hora).toDateString();

      if (!acumulacionFechas.includes(fechaFuncionActual)) {
        acumulacionFechas.push(fechaFuncionActual)
      }

      return acumulacionFechas
    }, [])
  })


  fechaSeleccionada = signal<string>("")

  setearFechaSeleccionada(fecha: string) {
    this.fechaSeleccionada.set(fecha)
    this.cantidadEntradas.set(1)

    const horarios = this.listaHorariosSegunFechaSeleccionada();
    this.funcionSeleccionada.set(horarios[0]);
    

  }


  listaHorariosSegunFechaSeleccionada = computed(() => {
    return this.funciones().filter((funcion) => {
      const fechaFuncionActual = new Date(funcion.fecha_hora).toDateString();
      return this.fechaSeleccionada() == fechaFuncionActual
    })

  })

  funcionSeleccionada = signal<Funcion | null>(null) // O SEA EL HORARIO

  setearFuncionSeleccionada(funcion: Funcion) {
    this.funcionSeleccionada.set(funcion)
    this.cantidadEntradas.set(1)
  }


  setearCantidad(incremento: number) {
    this.cantidadEntradas.update((actual) => {
      const nuevaCantidad = actual + incremento;
      if (nuevaCantidad < 1 || nuevaCantidad > 10) {
        return actual;
      }
      return nuevaCantidad;
    });
  }


  navegarHaciaCompra() {
    this.compraService.setearCantidadEntradas(this.cantidadEntradas())
    this.compraService.setearFuncion(this.funcionSeleccionada()!)
    this.compraService.setearPelicula(this.pelicula()!)
    this.router.navigate(['comprar/datos'])
  }



  obtenerFechaHoraOriginal(fechaTexto: string): string {
    const funcion = this.funciones().find((funcion) => new Date(funcion.fecha_hora).toDateString() === fechaTexto);
    if (funcion != undefined){
      return funcion.fecha_hora
    } 
    else{
      return ""
    }
}

}