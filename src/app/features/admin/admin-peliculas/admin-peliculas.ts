import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeliculasService } from '../../../core/services/peliculas-service';
import { Pelicula } from '../../../core/models/peliculaInterface';
import { Genero } from '../../../core/models/generoInterface';
import { Header } from '../../../layout/header/header';
@Component({
  imports: [ReactiveFormsModule, Header],
  selector: 'app-admin-peliculas',
  styleUrl: './admin-peliculas.css',
  templateUrl: './admin-peliculas.html',
})
export class AdminPeliculas implements OnInit {
  private peliculasService = inject(PeliculasService);

  peliculas = signal<Pelicula[]>([]);
  generos = signal<Genero[]>([]);
  idsGenerosSeleccionados = signal<number[]>([]);

  formulario = new FormGroup({
    titulo: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    sinopsis: new FormControl('', [Validators.required, Validators.maxLength(500)]),
    portada: new FormControl('', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]),
    duracion: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(400)]),
    restriccion_edad: new FormControl('', { nonNullable: true }),
    ya_estrenada_previamente: new FormControl(false, { nonNullable: true }),
  });

  get controles() {
    return this.formulario.controls;
  }

  async ngOnInit() {
    this.generos.set(await this.peliculasService.obtenerTodosLosGeneros());
    await this.recargarPeliculas()
  }

  async recargarPeliculas() {
    const lista = await this.peliculasService.obtenerPeliculasAdmin();
    this.peliculas.set(lista);
  }

  alternarGenero(idGenero: number) {
    const actuales = this.idsGenerosSeleccionados();

    if (actuales.includes(idGenero)) {
      this.idsGenerosSeleccionados.update((listaActual) => listaActual.filter(id => id !== idGenero));
    } else {
      this.idsGenerosSeleccionados.update((listaActual) => [...listaActual, idGenero]);
    }
  }

  terminosBusqueda = signal<string>("")


  peliculasFiltradas = computed(() => {
    let peliculas = this.peliculas()

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "")  // por si escribe 2 espacios

      peliculas = peliculas.filter((pelicula) => {
        const palabrasTitulo = pelicula.titulo.toLowerCase().split(" ")

        return arrayPalabras.some((palabraBuscada) =>
          palabrasTitulo.some((palabraTitulo) => palabraTitulo.startsWith(palabraBuscada))
        )
      })
    }

    return peliculas
  })

  peliculaEnEdicion = signal<Pelicula | null>(null);


  prepararEdicion(pelicula: Pelicula) {
    this.peliculaEnEdicion.set(pelicula);

    let restriccionEdad = ""
    if (pelicula.restriccion_edad) {
      restriccionEdad = pelicula.restriccion_edad.toString()
    }

    this.formulario.patchValue({
      titulo: pelicula.titulo,
      sinopsis: pelicula.sinopsis,
      portada: pelicula.portada,
      duracion: pelicula.duracion,
      restriccion_edad: restriccionEdad,
      ya_estrenada_previamente: pelicula.ya_estrenada_previamente,
    });

    this.idsGenerosSeleccionados.set(
      pelicula.pelicula_generos.map((relacion) => relacion.generos.id_genero)
    );
  }

  terminarEdicion() {
    this.peliculaEnEdicion.set(null)
    this.formulario.reset()
    this.idsGenerosSeleccionados.set([])
  }

  async guardar() {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return
    }

    if (this.idsGenerosSeleccionados().length == 0) {
      alert('Selecciona al menos un género')
      return
    }

    const valores = this.formulario.getRawValue();


    let restriccionEdad: number | null = null
    if (valores.restriccion_edad != "") {
      restriccionEdad = Number(valores.restriccion_edad)
    }

    const datos = {
      titulo: valores.titulo!,
      sinopsis: valores.sinopsis!,
      portada: valores.portada!,
      duracion: valores.duracion!,
      restriccion_edad: restriccionEdad,
      ya_estrenada_previamente: valores.ya_estrenada_previamente,
    };


    let verificacionSupaBase = false


    if (this.peliculaEnEdicion()) {
      verificacionSupaBase = await this.peliculasService.modificarPelicula(this.peliculaEnEdicion()!.id_pelicula, datos, this.idsGenerosSeleccionados());
    } else {
      verificacionSupaBase = await this.peliculasService.crearPelicula(datos, this.idsGenerosSeleccionados());
    }


    if (!verificacionSupaBase) {
      alert('Ocurrió un error al guardar la pelicula')
      return;
    }

    if (this.peliculaEnEdicion()) {
      alert('Los cambios se guardaron correctamente')
    } else {
      alert('Película creada con exito')
    }

    this.terminarEdicion();
    await this.recargarPeliculas();
  }

  async cambiarEstado(pelicula: Pelicula) {
    const verificacionSupaBase = await this.peliculasService.cambiarEstadoPelicula(pelicula.id_pelicula, !pelicula.activo);
    if (verificacionSupaBase) {
      await this.recargarPeliculas()

      if (pelicula.activo) {
        alert('La película fue dada de baja correctamente')
      }
      else {
        alert('La película se reactivo correctamente')
      }
    }
  }

  puedeModificarEstreno = computed(() => {
    const pelicula = this.peliculaEnEdicion()

    if (!pelicula) {
      return true
    }

    // si alguna función es de hoy o ya pasó, la película ya se estreno (o sea ya esta en el catalogo)
    const yaEmpezoAProyectarse = pelicula.funciones.some((funcion) =>
      this.peliculasService.esHoyOEsPasada(funcion.fecha_hora)
    )

    if (yaEmpezoAProyectarse) {
      return false
    }

    return true
  })

  estaEstrenada(pelicula: Pelicula): boolean {
    return this.peliculasService.perteneceACatalogoGeneral(pelicula)
  }


}