import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { VentasService } from '../../../core/services/ventas-service';
import { AuthService } from '../../../core/services/auth';
import { ResenasService } from '../../../core/services/resenas-services';
import { Resena } from '../../../core/models/resenaInterface';

@Component({
  imports: [],
  selector: 'app-mis-resenas',
  styleUrl: './mis-resenas.css',
  templateUrl: './mis-resenas.html',
})
export class MisResenas implements OnInit {
  private ventasService = inject(VentasService);
  private authService = inject(AuthService);
  private resenasService = inject(ResenasService);

  compras = signal<any[]>([]);

  // OBTENGO TODAS LAS COMPRAS DE ESE USUARIO
  async recargarCompras() {
    const usuario = this.authService.currentUserData();
    if (usuario) {
      this.compras.set(await this.ventasService.obtenerComprasDeUsuario(usuario.id));
    }
  }


  // FILTRO Y SOLO PONGO LAS COMPRAS ACTIVAS Y COMPRAS DE FUNCIONES A PELICULAS QUE YA PASARON
peliculasVistas = computed(() => {
    const comprasPasadas = this.compras().filter(
        (venta) => venta.estado === 'activa' && this.yaPaso(venta)
    );

    const peliculasVistas: any[] = [];

    for (const compra of comprasPasadas) {
        const peliculaEvaluando = compra.detalle_ventas.funciones?.peliculas

        const yaEstaAgregada = peliculasVistas.some((peli) => peli.id_pelicula === peliculaEvaluando?.id_pelicula);

        if (peliculaEvaluando && !yaEstaAgregada) {
            peliculasVistas.push(peliculaEvaluando);
        }
    }

    return peliculasVistas;
  });


  

  private yaPaso(venta: any): boolean {
    const fechaFuncion = venta.detalle_ventas?.funciones?.fecha_hora;
    return new Date(fechaFuncion) <= new Date();
  }



  resenas = signal<Resena[]>([]);

  // OBTENGO TODAS LAS RESEÑAS DE ESE USUARIO
  async recargarResenas() {
    const usuario = this.authService.currentUserData();
    if (usuario) {
      this.resenas.set(await this.resenasService.obtenerResenasDeUsuario(usuario.id));
    }
  }


  async ngOnInit() {
    await this.recargarCompras();
    await this.recargarResenas();
  }


  // PARA SABER SI LA PELICULA YA TIENE UNA RESEÑA, O SEA SI ESTOY EDITANDO O CREANDO (SI TIENE UNA RESEÑA QUE LA DEVUELVA)
  obtenerResenaDePelicula(idPelicula: number): Resena | undefined {
    return this.resenas().find((resena) => resena.id_pelicula === idPelicula);
  }


  // para cuando se abre el form, seteamos el id de la pelicula con form abierto, su calificacion y comentario (si es una reseña nueva van a tener null)
  idPeliculaFormAbierto = signal<number | null>(null);
  calificacionSeleccionada = signal<number>(0);
  comentarioResena = signal<string>('');


  // seteamos el id de la pelicula con form abierto, y calificacion y comentario que ya tenian
  abrirFormularioResenaExistente(idPelicula: number) {
    this.idPeliculaFormAbierto.set(idPelicula);

    const resenaExistente = this.obtenerResenaDePelicula(idPelicula);

    if (resenaExistente) {
      this.calificacionSeleccionada.set(resenaExistente.calificacion);
      this.comentarioResena.set(resenaExistente.comentario ?? '');
    }

  }


// seteamos el id de la pelicula con form abierto, y calificacion y comentario vacios
  abrirFormularioResenaNueva(idPelicula: number) {
    this.idPeliculaFormAbierto.set(idPelicula);
    this.calificacionSeleccionada.set(0);
    this.comentarioResena.set('');

  }



  // guardamos (sirve tanto para editar reseñas como para crear)
  async guardarResena(idPelicula: number) {
    if (this.calificacionSeleccionada() === 0) {
      alert('Seleccioná una calificación de 1 a 5 estrellas');
      return;
    }

    const usuario = this.authService.currentUserData();
    if (!usuario) return;

    const resenaExistente = this.obtenerResenaDePelicula(idPelicula);

    let verificacionSupaBase = false;

    if (resenaExistente) {
      verificacionSupaBase = await this.resenasService.modificarResena(usuario.id, idPelicula, this.calificacionSeleccionada(), this.comentarioResena());
    } else {
      verificacionSupaBase = await this.resenasService.crearResena(usuario.id, idPelicula, this.calificacionSeleccionada(), this.comentarioResena());
    }

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al guardar la reseña');
      return;
    }

    this.cerrarFormularioResena();
    await this.recargarResenas();
  }




  // cerramos el form, se setea el id en null y la calificacion y comentario vacios
  cerrarFormularioResena() {
    this.idPeliculaFormAbierto.set(null);
    this.calificacionSeleccionada.set(0);
    this.comentarioResena.set('');
  }



// eliminamos reseña
  async eliminarResena(idPelicula: number) {
    const confirmacion = confirm('¿Estás seguro que querés eliminar tu reseña?');
    if (!confirmacion) {
      return;
    }

    const usuario = this.authService.currentUserData();
    if (!usuario) return;

    const verificacionSupaBase = await this.resenasService.eliminarResena(usuario.id, idPelicula);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al eliminar la reseña');
      return;
    }

    await this.recargarResenas();
  }
}