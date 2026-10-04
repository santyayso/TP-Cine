import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CuponesService } from '../../../core/services/cupones-service';
import { AuthService } from '../../../core/services/auth';
import { CuponUsuario } from '../../../core/models/cuponUsuarioInterface';

@Component({
  imports: [DatePipe],
  selector: 'app-mis-cupones',
  styleUrl: './mis-cupones.css',
  templateUrl: './mis-cupones.html',
})
export class MisCupones implements OnInit {
  private cuponesService = inject(CuponesService);
  private authService = inject(AuthService);

  cuponesDisponibles = signal<CuponUsuario[]>([]);

  async ngOnInit() {
    const usuario = this.authService.currentUserData();
    if (usuario) {
      this.cuponesDisponibles.set(await this.cuponesService.obtenerCuponesDisponiblesDe(usuario.id));
    }
  }
}