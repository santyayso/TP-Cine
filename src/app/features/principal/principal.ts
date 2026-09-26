import { CardPelicula } from "../../shared/card-pelicula/card-pelicula";
import { Component, signal, OnInit, computed, inject } from '@angular/core';
import { PeliculasService } from "../../core/services/peliculas-service";
import { Genero } from "../../core/models/generoInterface";
import { Pelicula } from "../../core/models/peliculaInterface";
import { peliculaGeneroRelacion } from "../../core/models/peliculaGeneroRelacion";

@Component({
  imports: [CardPelicula],
  selector: 'app-principal',
  styleUrl: './principal.css',
  templateUrl: './principal.html',
})
export class Principal implements OnInit {

  private peliculasService = inject(PeliculasService);
  listaPeliculas = signal<Pelicula[]>([]);
  listaGeneros = signal<Genero[]>([])
  idGenerosSeleccionados = signal<any[]>([])
  terminosBusqueda = signal<string>("")

  async ngOnInit() {
    const data = await this.peliculasService.obtenerTodasLasPeliculasActivas();
    // const peliculasProcesadas = data.map((pelicula: Pelicula) => this.peliculasService.filtrarFunciones(pelicula));
    this.listaPeliculas.set(data);

    const generos = await this.peliculasService.obtenerTodosLosGeneros();
    this.listaGeneros.set(generos)
  }


  alternarGenero(idGenero: number) {
    const actuales = this.idGenerosSeleccionados();

    if (actuales.includes(idGenero)) {
      this.idGenerosSeleccionados.update((listaActual) => listaActual.filter(id => id !== idGenero));
    } else {
      this.idGenerosSeleccionados.update((listaActual) => [...listaActual, idGenero]);
    }

  }


  listaPeliculasProximamente = computed(() =>
    this.listaPeliculas()
    .filter((pelicula) => this.peliculasService.perteneceAProximamente(pelicula))
    .map((pelicula) => this.peliculasService.filtrarFunciones(pelicula))
  );


  listaPeliculasCatalogoGeneral = computed(() => {
    let peliculas = this.listaPeliculas()
    .filter((pelicula) => this.peliculasService.perteneceACatalogoGeneral(pelicula))
    .map((pelicula) => this.peliculasService.filtrarFunciones(pelicula))


    if (!(this.terminosBusqueda() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .toLocaleLowerCase()
        .split(" ");

      peliculas = peliculas.filter((pelicula) => {
        return arrayPalabras.some((palabra) =>
          pelicula.titulo.toLocaleLowerCase().includes(palabra)
        )
      })
    }


    if (!(this.idGenerosSeleccionados().length == 0)) {
      peliculas = peliculas.filter((pelicula) =>
        pelicula.pelicula_generos.some((relacion: peliculaGeneroRelacion) =>
          this.idGenerosSeleccionados().includes(relacion.generos.id_genero)
        )
      );
    }

    return peliculas

  }



  );


}
