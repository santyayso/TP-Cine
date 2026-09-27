import { Directive, effect, inject, Input, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth';


@Directive({
  selector: '[appRole]'
})
export class RoleDirective {

  private templateRef = inject(TemplateRef<unknown>);

  
  private viewContainer = inject(ViewContainerRef);


  private authService = inject(AuthService);

  private rolRequerido = signal<string>('');


  @Input() set appRole(rol: string) {
    this.rolRequerido.set(rol);
  }

  constructor() {

    effect(() => {
      const userData = this.authService.currentUserData();
      const role = this.rolRequerido();

  
      this.viewContainer.clear();

      if (userData && userData.rol === role) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}