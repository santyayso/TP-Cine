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

  private crearGraficoDeBarras(idCanvas: string, datos: any[], campoEtiqueta: string) {
    const canvas = document.getElementById(idCanvas) as HTMLCanvasElement;

    const etiquetas = datos.map((fila) => fila[campoEtiqueta]);
    const cantidades = datos.map((fila) => fila.cantidad);

    const colores = ['#e63946', '#f1a208', '#2a9d8f', '#457b9d', '#9b5de5', '#f15bb5', '#00bbf9', '#fee440'];

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Cantidad vendida',
          data: cantidades,
          backgroundColor: etiquetas.map((_, indice) => colores[indice % colores.length]),
          borderRadius: 6,
        }],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}