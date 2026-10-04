import { Component, OnInit, inject, signal } from '@angular/core';
import { ReportesService } from '../../../core/services/reportes-service';
import { CurrencyPipe } from '@angular/common';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
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


  }
}