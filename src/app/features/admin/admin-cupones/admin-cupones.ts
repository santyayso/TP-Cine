import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuponesService } from '../../../core/services/cupones-service';
import { Cupon } from '../../../core/models/cuponInterface';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
@Component({
  imports: [ReactiveFormsModule, Header, Footer],
  selector: 'app-admin-cupones',
  styleUrl: './admin-cupones.css',
  templateUrl: './admin-cupones.html',
})
export class AdminCupones implements OnInit {
  private cuponesService = inject(CuponesService);

  cupones = signal<Cupon[]>([]);

  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    porcentaje: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(100)]),
    edad_minima: new FormControl<number | null>(null, [Validators.min(1), Validators.max(120)]),
  });

  get controles() {
    return this.formulario.controls;
  }

  async ngOnInit() {
    await this.recargarCupones()
  }

  async recargarCupones() {
    const lista = await this.cuponesService.obtenerCuponesAdmin();
    this.cupones.set(lista);
  }

  terminosBusqueda = signal<string>("")


  cuponesFiltrados = computed(() => {
    let cupones = this.cupones()

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "")  // por si escribe 2 espacios

      cupones = cupones.filter((cupon) => {
        const palabrasNombre = cupon.nombre.toLowerCase().split(" ")

        return arrayPalabras.some((palabraBuscada) =>
          palabrasNombre.some((palabra) => palabra.startsWith(palabraBuscada))
        )
      })
    }

    return cupones
  })


  cuponEnEdicion = signal<Cupon | null>(null);


  prepararEdicion(cupon: Cupon) {
    this.cuponEnEdicion.set(cupon);
    this.formulario.patchValue({
      nombre: cupon.nombre,
      porcentaje: cupon.porcentaje,
      edad_minima: cupon.edad_minima,
    });
    this.formulario.controls.edad_minima.disable()
  }

  terminarEdicion() {
    this.cuponEnEdicion.set(null)
    this.formulario.controls.edad_minima.enable()
    this.formulario.reset()
  }

  async guardar() {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return
    }

    const valores = this.formulario.getRawValue();

    if (this.cuponEnEdicion()) {

      const verificacionSupaBase = await this.cuponesService.modificarCupon(
        this.cuponEnEdicion()!.id_cupon,
        valores.nombre!,
        valores.porcentaje!
      );

      if (!verificacionSupaBase) {
        alert('Ocurrió un error al guardar el cupón')
        return;
      }

      alert('Los cambios se guardaron correctamente')

    } else {

      const datos = {
        nombre: valores.nombre!,
        porcentaje: valores.porcentaje!,
        edad_minima: valores.edad_minima,
      };

      const cuponCreado = await this.cuponesService.crearCupon(datos);

      if (!cuponCreado) {
        alert('Ocurrió un error al guardar el cupón')
        return;
      }

      // los usuarios ya registrados tambien reciben el cupon nuevo
      await this.cuponesService.otorgarCuponATodosLosUsuariosExistentes(cuponCreado);

      alert('Cupón creado con exito')
    }

    this.terminarEdicion();
    await this.recargarCupones();
  }

  async cambiarEstado(cupon: Cupon) {
    const verificacionSupaBase = await this.cuponesService.cambiarEstadoCupon(cupon.id_cupon, !cupon.activo);
    if (verificacionSupaBase) {
      await this.recargarCupones()

      if (cupon.activo) {
        alert('El cupón fue dado de baja correctamente')
      }
      else {
        alert('El cupón se reactivó correctamente')
      }
    }
  }
}