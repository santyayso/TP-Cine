import { CardPelicula } from "../../shared/card-pelicula/card-pelicula";
import { Component, signal, OnInit, computed, inject } from '@angular/core';
import { PeliculasService } from "../../core/services/peliculas-service";
import { Genero } from "../../core/models/generoInterface";
import { Pelicula } from "../../core/models/peliculaInterface";
import { peliculaGeneroRelacion } from "../../core/models/peliculaGeneroRelacion";
import { Header } from "../../layout/header/header";
import { Footer } from "../../layout/footer/footer";
import { ReportesService } from "../../core/services/reportes-service";
@Component({
  imports: [CardPelicula, Header, Footer],
  selector: 'app-principal',
  styleUrl: './principal.css',
  templateUrl: './principal.html',
})
export class Principal implements OnInit {

  private peliculasService = inject(PeliculasService);
  listaPeliculas = signal<Pelicula[]>([]);
  private reportesService = inject(ReportesService);

  listaGeneros = signal<Genero[]>([])
  idGenerosSeleccionados = signal<any[]>([])
  terminosBusqueda = signal<string>("")

  idsMasVendidos = signal<number[]>([]);

  async ngOnInit() {
    const data = await this.peliculasService.obtenerTodasLasPeliculasActivas();
    // const peliculasProcesadas = data.map((pelicula: Pelicula) => this.peliculasService.filtrarFunciones(pelicula));
    this.listaPeliculas.set(data);


    const generos = await this.peliculasService.obtenerTodosLosGeneros();
    this.listaGeneros.set(generos)

    const masVistas = await this.reportesService.obtenerPeliculasMasVistas(30);
    this.idsMasVendidos.set(masVistas.map((fila) => fila.id_pelicula));

  }


  alternarGenero(idGenero: number) {
    const actuales = this.idGenerosSeleccionados();

    if (actuales.includes(idGenero)) {
      this.idGenerosSeleccionados.update((listaActual) => listaActual.filter(id => id !== idGenero));
    } else {
      this.idGenerosSeleccionados.update((listaActual) => [...listaActual, idGenero]);
    }

  }


  listaPeliculasMasVendidas = computed(() => {
    const peliculasMasVendidas: Pelicula[] = []

    for (const id of this.idsMasVendidos()) {
      const peliculaEncontrada = this.listaPeliculas().find((peliculaDeLista) => peliculaDeLista.id_pelicula === id)

      if (peliculaEncontrada) {
         peliculasMasVendidas.push(this.peliculasService.filtrarFunciones(peliculaEncontrada))
      }
    }



    return peliculasMasVendidas.slice(0, 5)
  })



  listaPeliculasProximamente = computed(() =>
    this.listaPeliculas()
      .filter((pelicula) => this.peliculasService.perteneceAProximamente(pelicula))
      .map((pelicula) => this.peliculasService.filtrarFunciones(pelicula))


  );


  listaPeliculasCatalogoGeneral = computed(() => {
    let peliculas = this.listaPeliculas()
      .filter((pelicula) => this.peliculasService.perteneceACatalogoGeneral(pelicula))
      .map((pelicula) => this.peliculasService.filtrarFunciones(pelicula))

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "") //  por si escribe 2 espacios

      peliculas = peliculas.filter((pelicula) => {
        const palabrasTitulo = pelicula.titulo.toLowerCase().split(" ")

        return arrayPalabras.some((palabraBuscada) =>
          palabrasTitulo.some((palabraTitulo) => palabraTitulo.startsWith(palabraBuscada))
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


 // este metodo lo pongo porque lo necesito en html y no quiero hacer el servicio publico
  esProximamente(pelicula: Pelicula): boolean {
    return this.peliculasService.perteneceAProximamente(pelicula)
  }

   
 


}
