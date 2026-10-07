import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CompraService } from '../../../core/services/compra-service';
import { inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
import { AuthService } from '../../../core/services/auth';
import { formatDate } from '@angular/common';
@Component({
  imports: [ReactiveFormsModule, Header, Footer],
  selector: 'app-datos-compra',
  styleUrl: './datos-compra.css',
  templateUrl: './datos-compra.html',
})

export class DatosCompra implements OnInit {
  private compraService = inject(CompraService)
  private router = inject(Router)
  private authService = inject(AuthService)
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


  })

  ngOnInit(): void {
    const usuario = this.authService.currentUserData()
    const email = this.authService.currentUser()?.email

    // si es invitado: se queda en el formulario
    if (!usuario || !email) {
      return
    }

     const fechaDeNacimiento = formatDate(usuario.fecha_nacimiento, 'dd/MM/yyyy', 'en-US')

    if (!this.cumpleRestriccionEdad(fechaDeNacimiento)) {
      alert('No cumplís con la edad mínima requerida para esta película.')
      this.router.navigate(['/pelicula', this.compraService.peliculaSeleccionada()!.id_pelicula])
      return
    }

    this.compraService.setearDatosComprador({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: email,
      fechaDeNacimiento: fechaDeNacimiento,
    })

    this.router.navigate(['/comprar/butacas'], { replaceUrl: true })
  }


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
      this.router.navigate(['/pelicula', this.compraService.peliculaSeleccionada()!.id_pelicula])
      return;
    }

    this.compraService.setearDatosComprador({
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      email: formValue.email!,
      fechaDeNacimiento: formValue.fechaDeNacimiento!,

    });

    this.router.navigate(['/comprar/butacas']);

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
