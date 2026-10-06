import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalasService } from '../../../core/services/salas-services';
import { Sala } from '../../../core/models/salaInterface';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';

@Component({
  imports: [ReactiveFormsModule, Header, Footer],
  selector: 'app-admin-salas',
  styleUrl: './admin-salas.css',
  templateUrl: './admin-salas.html',
})
export class AdminSalas implements OnInit {
  private salasService = inject(SalasService)
  salas = signal<Sala[]>([])

  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
  });

  get controles() {
    return this.formulario.controls;
  }

  async ngOnInit() {
    await this.recargarSalas()
  }

  async recargarSalas() {
    this.salas.set(await this.salasService.obtenerSalasAdmin())
  }


  // =====================
  // EDITAR
  // =====================

  // guarda null si se está creando, y la sala si se está editando
  salaEnEdicion = signal<Sala | null>(null);

  prepararEdicion(sala: Sala) {
    this.salaEnEdicion.set(sala);

    this.formulario.patchValue({
      nombre: sala.nombre,
    });
  }

  terminarEdicion() {
    this.salaEnEdicion.set(null)
    this.formulario.reset()
  }


  // =====================
  // GUARDAR (sirve para crear y para editar)
  // =====================

  async guardar() {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return
    }

    // trim para sacar espacios de los costados (por si escribe "   " o " Sala 1 ")
    const nombre = this.formulario.getRawValue().nombre!.trim()

    if (nombre == '') {
      alert('El nombre no puede estar vacío')
      return
    }

    let verificacionSupaBase = false

    if (this.salaEnEdicion()) {
      verificacionSupaBase = await this.salasService.modificarSala(this.salaEnEdicion()!.id_sala, nombre);
    } else {
      verificacionSupaBase = await this.salasService.crearSala(nombre);
    }

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al guardar la sala')
      return;
    }

    if (this.salaEnEdicion()) {
      alert('Los cambios se guardaron correctamente')
    } else {
      alert('Sala creada con éxito')
    }

    this.terminarEdicion();
    await this.recargarSalas();
  }


  // =====================
  // DAR DE BAJA / REACTIVAR
  // =====================

  async cambiarEstado(sala: Sala) {
    // para dar de baja, la sala no puede tener funciones futuras asignadas (reactivar siempre se puede)
    if (sala.activo) {
      const tieneFunciones = await this.salasService.tieneFuncionesFuturas(sala.id_sala);

      if (tieneFunciones) {
        alert('No se puede dar de baja esta sala porque tiene funciones asignadas.')
        return
      }
    }

    const verificacionSupaBase = await this.salasService.cambiarEstadoSala(sala.id_sala, !sala.activo);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al cambiar el estado de la sala')
      return
    }

    await this.recargarSalas()

    if (sala.activo) {
      alert('La sala fue dada de baja correctamente')
    }
    else {
      alert('La sala se reactivó correctamente')
    }
  }
}