import { Component, OnInit, inject, signal } from '@angular/core';
import { ReportesService } from '../../../core/services/reportes-service';
import { CurrencyPipe } from '@angular/common';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
import { Chart } from 'chart.js/auto';

@Component({
  imports: [CurrencyPipe, Header, Footer],
  selector: 'app-admin-reportes',
  styleUrl: './admin-reportes.css',
  templateUrl: './admin-reportes.html',
})
export class AdminReportes implements OnInit {
  private reportesService = inject(ReportesService);

  facturacionDeHoy = signal<number>(0);

  async ngOnInit() {
    this.facturacionDeHoy.set(await this.reportesService.obtenerFacturacionDeHoy());

    const peliculasSemana = await this.reportesService.obtenerPeliculasMasVistas(7);
    this.crearGraficoDeBarras('graficoPeliculasSemana', peliculasSemana, 'titulo');

    const peliculasMes = await this.reportesService.obtenerPeliculasMasVistas(30);
    this.crearGraficoDeBarras('graficoPeliculasMes', peliculasMes, 'titulo');

    const candySemana = await this.reportesService.obtenerCandyMasVendido(7);
    this.crearGraficoDeBarras('graficoCandySemana', candySemana, 'nombre');

    const candyMes = await this.reportesService.obtenerCandyMasVendido(30);
    this.crearGraficoDeBarras('graficoCandyMes', candyMes, 'nombre');
  }


  // campoEtiqueta es el atributo por el cual se va a filtrar cada barra, en pelicula seria el titulo
  private crearGraficoDeBarras(idCanvas: string, datos: any[], campoEtiqueta: string) {
    const canvas = document.getElementById(idCanvas) as HTMLCanvasElement;

    const etiquetas = datos.map((fila) => fila[campoEtiqueta]);
    const cantidades = datos.map((fila) => fila.cantidad);



    new Chart(canvas, {
      type: 'bar',
      //labels va justamente el titulo de la pelicula, que lo obtenemos a partir del filtro que le pasamos por parametros
      data: {
        labels: etiquetas,
        datasets: [{
          // label es la etiqueta de lo que esta representando el grafico
          label: 'Cantidad vendida',
          data: cantidades,
          borderRadius: 6,
        }],
      }
    });
  }
}