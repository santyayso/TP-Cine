import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {
    authService = inject(AuthService);

}
