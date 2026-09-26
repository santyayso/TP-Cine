import { Component, input, inject, signal, OnInit, computed } from '@angular/core';
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
  fechaSeleccionada = signal<string>("")
  cantidadEntradas = signal<number>(1)
  funcionSeleccionada = signal<Funcion | null>(null)

  async ngOnInit() {
    const pelicula = await this.peliculasService.obtenerPeliculaPorId(this.id())

    if (!pelicula) return

    const peliculaProcesada = this.peliculasService.filtrarFunciones(pelicula)
    this.pelicula.set(peliculaProcesada)
    this.funciones.set(peliculaProcesada.funciones)

    // console.log('peli:', pelicula);
    // console.log('generos:', pelicula.pelicula_generos);

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


  listaFuncionesSegunFechaSeleccionada = computed(() => {
    return this.funciones().filter((funcion) => {
      const fechaFuncionActual = new Date(funcion.fecha_hora).toDateString();
      return this.fechaSeleccionada() == fechaFuncionActual
    })

  })

  setearCantidad(incremento: number) {
    this.cantidadEntradas.update((actual) => {
      const nuevaCantidad = actual + incremento;
      if (nuevaCantidad < 1 || nuevaCantidad > 10) {
        return actual;  
      }
      return nuevaCantidad;
    });
  }

  setearFechaSeleccionada(fecha: string){
    this.fechaSeleccionada.set(fecha)
    this.funcionSeleccionada.set(null)
    this.cantidadEntradas.set(1)

  }

  setearFuncionSeleccionada(funcion: Funcion){
    this.funcionSeleccionada.set(funcion)
    this.cantidadEntradas.set(1)
  }

  navegarHaciaCompra() {

    this.compraService.setearCantidadEntradas(this.cantidadEntradas())
    this.compraService.setearFuncion(this.funcionSeleccionada()!)
    this.compraService.setearPelicula(this.pelicula()!)
    this.router.navigate(['comprar/datos'])
  }

}
