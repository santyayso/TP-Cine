import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TipoSangre, ColorOjos } from '../../../core/models/usuariointerface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  tipoDeSangre: TipoSangre[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  colorDeOjos: ColorOjos[] = ['Marrón', 'Negro', 'Azul', 'Celeste', 'Verde', 'Otro']


  private fb = inject(FormBuilder);
  private authService = inject(AuthService);



  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    tipoDeSangre: ['', [Validators.required]],
    colorDeOjos: ['', [Validators.required]],
    cantidadDiasVacaciones: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    fechaDeNacimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/)]],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);


  get formularioControles() {
    return this.registerForm.controls;
  }


  private convertirFechaParaSupabase(fechaDDMMAAAA: string): string {
    const [dia, mes, anio] = fechaDDMMAAAA.split('/');
    return `${anio}-${mes}-${dia}`;  
  }


  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { nombre, apellido, email, password, fechaDeNacimiento, tipoDeSangre, colorDeOjos, cantidadDiasVacaciones } = this.registerForm.value;

    try {

      const { data, error } = await this.authService.signUp(
        email!,
        password!,
        nombre!,
        apellido!,
        this.convertirFechaParaSupabase(fechaDeNacimiento!),
        tipoDeSangre! as TipoSangre,
        colorDeOjos! as ColorOjos,
        cantidadDiasVacaciones!
      );

      if (error) throw error;


      if (data.user?.identities?.length === 0) {
        this.errorMessage.set('Este email ya está registrado.');
      } else if (data.user) {
        this.successMessage.set('¡Registro exitoso! Por favor verifica tu email o inicia sesión.');
        this.registerForm.reset();
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al registrarse');
    } finally {
      this.isLoading.set(false);
    }
  }
}