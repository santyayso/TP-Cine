import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../../core/services/ventas-service';
import { AuthService } from '../../../core/services/auth';
import { ResenasService } from '../../../core/services/resenas-services';
import { Resena } from '../../../core/models/resenaInterface';

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-mis-compras',
  styleUrl: './mis-compras.css',
  templateUrl: './mis-compras.html',
})
export class MisCompras implements OnInit {
  private ventasService = inject(VentasService);
  private authService = inject(AuthService);
  private resenasService = inject(ResenasService);

  compras = signal<any[]>([]);
  resenas = signal<Resena[]>([]);
  

  async ngOnInit() {
    await this.recargarCompras();
    await this.recargarResenas();
  }

  async recargarCompras() {
    const usuario = this.authService.currentUserData();
    if (usuario) {
      this.compras.set(await this.ventasService.obtenerComprasDeUsuario(usuario.id));
    }
  }

  async recargarResenas() {
    const usuario = this.authService.currentUserData();
    if (usuario) {
      this.resenas.set(await this.resenasService.obtenerResenasDeUsuario(usuario.id));
    }
  }

  comprasCanceladas = computed(() =>
    this.compras().filter((venta) => venta.estado === 'cancelada')
  );

  comprasProximas = computed(() =>
    this.compras().filter((venta) => venta.estado === 'activa' && !this.yaPaso(venta))
  );

  comprasConResena = computed(() =>
    this.compras().filter((venta) => venta.estado === 'activa' && this.yaPaso(venta))
  );

  private yaPaso(venta: any): boolean {
    const fechaFuncion = venta.detalle_ventas?.funciones?.fecha_hora;
    if (!fechaFuncion) return false;
    return new Date(fechaFuncion) <= new Date();
  }

  puedeReembolsar(venta: any): boolean {
    const fechaFuncion = venta.detalle_ventas?.funciones?.fecha_hora;
    if (!fechaFuncion) return false;

    const DOS_HORAS_EN_MS = 2 * 60 * 60 * 1000;
    return new Date(fechaFuncion).getTime() - Date.now() > DOS_HORAS_EN_MS;
  }

  async reembolsar(venta: any) {
    const confirmacion = confirm('¿Estás seguro que querés cancelar esta compra? El monto se acreditará como crédito.');
    if (!confirmacion) {
      return;
    }

    const verificacionSupaBase = await this.ventasService.reembolsarVenta(venta.id_venta);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al procesar el reembolso');
      return;
    }

    const usuario = this.authService.currentUserData();

    if (usuario) {
      const nuevoSaldo = usuario.creditos_disponibles + venta.total;
      await this.authService.actualizarCreditos(usuario.id, nuevoSaldo);
    }

    await this.recargarCompras();
  }

  descargarPdf(venta: any) {
    const detalle = venta.detalle_ventas;
    const pelicula = detalle.funciones.peliculas;

    const butacas = detalle.butacas_vendidas.map((butaca: any) => ({
      fila: butaca.fila_butaca,
      numero: butaca.numero_butaca,
      tipo: butaca.tipo_butaca,
    }));

    const candy = detalle.candy_vendidos.map((producto: any) => ({
      nombre: producto.productos_candy.nombre,
      cantidad: producto.cantidad,
    }));

    this.ventasService.generarPdfCompra(
      venta.nombre,
      venta.apellido,
      pelicula.titulo,
      pelicula.restriccion_edad,
      detalle.funciones.fecha_hora,
      butacas,
      candy,
      detalle.codigo_qr
    );
  }

  // ===================== RESEÑAS =====================

  obtenerResenaDePelicula(idPelicula: number): Resena | undefined {
    return this.resenas().find((resena) => resena.id_pelicula === idPelicula);
  }

  peliculaEnFormularioResena = signal<number | null>(null);
  calificacionSeleccionada = signal<number>(0);
  comentarioResena = signal<string>('');

  abrirFormularioResena(idPelicula: number) {
    const resenaExistente = this.obtenerResenaDePelicula(idPelicula);

    if (resenaExistente) {
      this.calificacionSeleccionada.set(resenaExistente.calificacion);
      this.comentarioResena.set(resenaExistente.comentario ?? '');
    } else {
      this.calificacionSeleccionada.set(0);
      this.comentarioResena.set('');
    }

    this.peliculaEnFormularioResena.set(idPelicula);
  }

  cerrarFormularioResena() {
    this.peliculaEnFormularioResena.set(null);
    this.calificacionSeleccionada.set(0);
    this.comentarioResena.set('');
  }

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