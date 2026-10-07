import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LogService } from '../../../core/services/log-service';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';

@Component({
  imports: [DatePipe, Header, Footer],
  selector: 'app-admin-logs',
  styleUrl: './admin-logs.css',
  templateUrl: './admin-logs.html',
})
export class AdminLogs implements OnInit {
  private logService = inject(LogService);

  registros = signal<any[]>([]);
  terminosBusqueda = signal<string>("")

  async ngOnInit() {
    this.registros.set(await this.logService.obtenerLog());
  }

  registrosFiltrados = computed(() => {
    let registros = this.registros()

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "")

      registros = registros.filter((registro) => {
        const textoDelRegistro = `${registro.usuarios?.nombre} ${registro.usuarios?.apellido} ${registro.accion} ${registro.detalle}`.toLowerCase()

        return arrayPalabras.every((palabra) => textoDelRegistro.includes(palabra))
      })
    }

    return registros
  })
}