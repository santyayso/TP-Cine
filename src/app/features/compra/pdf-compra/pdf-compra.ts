import { Component, inject, signal } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CompraService } from '../../../core/services/compra-service';
import { Router } from '@angular/router';
import { Header } from '../../../layout/header/header';
import { VentasService } from '../../../core/services/ventas-service';
import { SalasService } from '../../../core/services/salas-services';
import { Footer } from '../../../layout/footer/footer';
@Component({
  selector: 'app-pdf-compra',
  imports: [Header, Footer],
  templateUrl: './pdf-compra.html',
  styleUrl: './pdf-compra.css',
})
export class PdfCompra {
  compraService = inject(CompraService);
  router = inject(Router)
  ventasService = inject(VentasService)
  salasService = inject(SalasService)

  async descargarPdf() {
    const pelicula = this.compraService.peliculaSeleccionada();
    const funcion = this.compraService.funcionSeleccionada();
    const datos = this.compraService.datosComprador();

    const nombreSala = await this.salasService.obtenerNombreSala(funcion!.id_sala)

    await this.ventasService.generarPdfCompra(
      datos!.nombre,
      datos!.apellido,
      pelicula!.titulo,
      pelicula!.restriccion_edad,
      funcion!.fecha_hora,
      this.compraService.butacasSeleccionadas(),
      this.compraService.listaCandyVendidos(),
      this.compraService.codigoQrGenerado(),
      nombreSala
    );
  }


  volverAlInicio() {
    this.router.navigate(["principal"])
  }
}