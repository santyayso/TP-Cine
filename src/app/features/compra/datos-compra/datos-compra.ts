import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CompraService } from '../../../core/services/compra-service';
import { inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { DatosComprador, TipoSangre } from '../../../core/models/datosCompradorInterface';
import { Router } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-datos-compra',
  styleUrl: './datos-compra.css',
  templateUrl: './datos-compra.html',
})

export class DatosCompra {
  private compraService = inject(CompraService)
  private router = inject(Router)
  tipoDeSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  colorDeOjos = ['Marrón', 'Negro', 'Azul', 'Celeste', 'Verde', 'Otro']

  datosCompraForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]),
    apellido: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    fechaDeNacimiento: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/),

    ]),
    tipoDeSangre: new FormControl('', [
      Validators.required
    ]),
    colorDeOjos: new FormControl('', [
      Validators.required
    ]),
    cantidadDiasVacaciones: new FormControl(0, [
      Validators.required,
      Validators.min(1),
      Validators.max(50)
    ])

  })


  get formularioControles() {
    return this.datosCompraForm.controls;
  }

  onSubmit(): void {

    this.datosCompraForm.markAllAsTouched();


    if (this.datosCompraForm.invalid) {
      return;
    }


    const formValue = this.datosCompraForm.getRawValue();

    if (!this.cumpleRestriccionEdad(formValue.fechaDeNacimiento!)) {
      alert('No cumplís con la edad mínima requerida para esta película.');
      return;
    }

    this.compraService.setearDatosComprador({
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      email: formValue.email!,
      fechaDeNacimiento: formValue.fechaDeNacimiento!,
      colorDeOjos: formValue.colorDeOjos!,
      tipoDeSangre: formValue.tipoDeSangre! as TipoSangre,
      cantidadDiasVacaciones: formValue.cantidadDiasVacaciones!

    });

    this.router.navigate(['/comprar/candy']);

  }

  private cumpleRestriccionEdad(fechaTexto: string): boolean {
    const pelicula = this.compraService.peliculaSeleccionada()!;
    if (!pelicula.restriccion_edad) return true;

    const edad = this.calcularEdad(fechaTexto);
    return edad >= pelicula.restriccion_edad;
  }


  private calcularEdad(fechaTexto: string): number {
    const [dia, mes, anio] = fechaTexto.split('/').map((texto) => Number(texto));
    const fechaNacimiento = new Date(anio, mes - 1, dia);

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

    const todaviaNoCumplioEsteAnio =
      hoy.getMonth() < fechaNacimiento.getMonth() ||
      (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate());

    if (todaviaNoCumplioEsteAnio) {
      edad--;
    }

    return edad;
  }


}
