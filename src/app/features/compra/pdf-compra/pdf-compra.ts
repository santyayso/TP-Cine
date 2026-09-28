import { Component, inject, signal } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CompraService } from '../../../core/services/compra-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pdf-compra',
  imports: [],
  templateUrl: './pdf-compra.html',
  styleUrl: './pdf-compra.css',
})
export class PdfCompra {
  compraService = inject(CompraService);
  router = inject(Router)

  descargarPdf() {
    const pelicula = this.compraService.peliculaSeleccionada();
    const funcion = this.compraService.funcionSeleccionada();
    const datos = this.compraService.datosComprador();

    if (!pelicula || !funcion || !datos) return;


    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text('Entrada de cine', 20, y);

    y += 15;
    doc.setFontSize(12);
    doc.text(`Comprador: ${datos.nombre} ${datos.apellido}`, 20, y);

    y += 10;
    doc.text(`Película: ${pelicula.titulo}`, 20, y);

    y += 8;
    doc.text(
      `Función: ${new Date(funcion.fecha_hora).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`,
      20, y
    );

    if (pelicula.restriccion_edad) {
      y += 8;
      doc.text(
        `Restricción: +${pelicula.restriccion_edad}. Los menores deben ir acompañados de un adulto.`,
        20, y
      );
    }

    y += 12;
    doc.text('Butacas:', 20, y);
    for (const butaca of this.compraService.butacasSeleccionadas()) {
      y += 7;
      doc.text(`${butaca.fila}${butaca.numero} (${butaca.tipo})`, 25, y);
    }

    const candy = this.compraService.listaCandyVendidos();
    if (candy.length > 0) {
      y += 12;
      doc.text('Candy:', 20, y);
      for (const item of candy) {
        y += 7;
        doc.text(`${item.nombre} x${item.cantidad}`, 25, y);
      }
    }

    doc.save('entrada.pdf');
   
  }


  volverAlInicio(){
    this.router.navigate(["principal"])
  }
}