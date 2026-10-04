import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { Header } from '../../../layout/header/header';
import { CurrencyPipe } from '@angular/common';
import { Footer } from '../../../layout/footer/footer';
@Component({
  imports: [ RouterLink, RouterLinkActive, RouterOutlet, Header, CurrencyPipe, Footer],
  selector: 'app-perfil-layout',
  styleUrl: './perfil-layout.css',
  templateUrl: './perfil-layout.html',
})
export class PerfilLayout {
   authService = inject(AuthService);
}
