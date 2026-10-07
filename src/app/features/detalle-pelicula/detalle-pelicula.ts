import { Component, input, inject, signal, OnInit, computed, effect } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas-service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Pelicula } from '../../core/models/peliculaInterface';
import { Funcion } from '../../core/models/funcionInterface';
import { CompraService } from '../../core/services/compra-service';
import { Router } from '@angular/router';
import { Header } from '../../layout/header/header';
import { Footer } from '../../layout/footer/footer';
import { ResenasService } from '../../core/services/resenas-services';
import { ResenaConUsuario } from '../../core/models/resenaConUsuarioInterface';

@Component({
  imports: [DatePipe, Header, Footer, DecimalPipe],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle-pelicula.css',
  templateUrl: './detalle-pelicula.html',
})
export class DetallePelicula implements OnInit {

  private peliculasService = inject(PeliculasService);
  private compraService = inject(CompraService)
  private router = inject(Router);
  private resenasService = inject(ResenasService)

  id = input.required<string>()
  pelicula = signal<Pelicula | null>(null)
  funciones = signal<Funcion[]>([])

  esProximamente = signal<boolean>(false);
  resenas = signal<ResenaConUsuario[]>([]);


  async ngOnInit() {
    const pelicula = await this.peliculasService.obtenerPeliculaPorId(this.id())

    if (!pelicula) return

    this.esProximamente.set(this.peliculasService.perteneceAProximamente(pelicula))

    const peliculaProcesada = this.peliculasService.filtrarFunciones(pelicula)
    this.pelicula.set(peliculaProcesada)
    this.funciones.set(peliculaProcesada.funciones)

    if (this.funciones().length != 0) {
      const fechas = this.fechaFunciones()
      this.setearFechaSeleccionada(fechas[0])
    }

    this.resenas.set(await this.resenasService.obtenerResenasDePelicula(peliculaProcesada.id_pelicula))


  }


  promedioCalificacion = computed(() => {
    if (this.resenas().length === 0){
      return 0
    } 
    const suma = this.resenas().reduce((acumulado, resena) => acumulado + resena.calificacion, 0);

    return suma / this.resenas().length;
  });


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
  }



  navegarHaciaCompra() {
    this.compraService.setearFuncion(this.funcionSeleccionada()!)
    this.compraService.setearPelicula(this.pelicula()!)
    this.router.navigate(['comprar/datos'])
  }
  obtenerFechaHoraOriginal(fechaTexto: string): string {
    const funcion = this.funciones().find((funcion) => new Date(funcion.fecha_hora).toDateString() === fechaTexto);
    if (funcion != undefined) {
      return funcion.fecha_hora
    }
    else {
      return ""
    }
  }

}