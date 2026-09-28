import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UsuariosService, ROLES } from '../../../core/services/usuariosService';
import { AuthService } from '../../../core/services/auth';
import { Usuario, RolUsuario } from '../../../core/models/usuariointerface';


@Component({
  imports: [],
  selector: 'app-admin-roles',
  styleUrl: './admin-roles.css',
  templateUrl: './admin-roles.html',
})
export class AdminRoles implements OnInit {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);

  usuarios = signal<Usuario[]>([]);
  roles = ROLES

  async ngOnInit() {
    await this.recargarUsuarios()
  }

  async recargarUsuarios() {
    const lista = await this.usuariosService.obtenerTodosLosUsuarios();
    this.usuarios.set(lista);
  }

  terminosBusqueda = signal<string>("")


  usuariosFiltrados = computed(() => {
    let usuarios = this.usuarios()

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "")  // por si escribe 2 espacios

      usuarios = usuarios.filter((usuario) => {
        return arrayPalabras.some((palabra) =>
          usuario.nombre.toLowerCase().includes(palabra) ||
          usuario.apellido.toLowerCase().includes(palabra)
        )
      })
    }

    return usuarios
  })


  // esto es para que el admin no pueda cambiarse  el rol a si mismo xd
  esMiUsuario(usuario: Usuario): boolean {
    return usuario.id == this.authService.currentUserData()?.id
  }


  async cambiarRol(usuario: Usuario, nuevoRol: string) {
    const verificacionSupaBase = await this.usuariosService.cambiarRolUsuario(usuario.id, nuevoRol as RolUsuario);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al cambiar el rol')
      await this.recargarUsuarios()   // el select vuelve al rol real
      return;
    }

    alert('El rol se cambió correctamente')
    await this.recargarUsuarios()
  }
}