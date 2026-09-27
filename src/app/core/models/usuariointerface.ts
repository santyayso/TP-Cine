export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  fecha_nacimiento: string;
  tipo_sangre: TipoSangre;
  color_ojos: ColorOjos;
  cantidad_dias_vacaciones: number;
}

export type TipoSangre = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ColorOjos = 'Marrón' | 'Negro' | 'Azul' | 'Celeste' | 'Verde' | 'Otro';