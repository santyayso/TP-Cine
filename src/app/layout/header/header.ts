import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { RoleDirective } from '../../shared/directives/role.directive';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, RoleDirective],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}