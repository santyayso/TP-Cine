import { Injectable, signal, inject } from '@angular/core';
import { Supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';
import { ColorOjos, TipoSangre, Usuario } from '../models/usuariointerface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(Supabase).cliente;


  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  currentUserData = signal<Usuario | null>(null);

  constructor() {
    this.initAuthSession();
  }


  private initAuthSession() {

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);

      if (session?.user) {
        this.cargarDatosUsuario(session.user.id);
      }
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        this.cargarDatosUsuario(session.user.id);
      } else {
        this.currentUserData.set(null);
      }
    });
  }


  private async cargarDatosUsuario(userId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al cargar datos del usuario:', error.message);
    } else if (data) {
      this.currentUserData.set(data);
    }
  }


  async signUp(
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    fechaDeNacimiento: string,
    tipoDeSangre: TipoSangre,
    colorDeOjos: ColorOjos,
    cantidadDiasVacaciones: number
  ) {
    return this.supabase.auth.signUp({
      email, password,
      options: {
        data: {
          nombre, apellido,
          fecha_nacimiento: fechaDeNacimiento,
          tipo_sangre: tipoDeSangre,
          color_ojos: colorDeOjos,
          cantidad_dias_vacaciones: cantidadDiasVacaciones
        }
      }
    });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }


  async signOut() {
    return this.supabase.auth.signOut();
  }
}