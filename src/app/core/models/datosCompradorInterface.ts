export interface DatosComprador {
    nombre: string;
    apellido: string;
    email: string;
    fechaDeNacimiento: string;
    tipoDeSangre: TipoSangre;
    colorDeOjos: string;
    cantidadDiasVacaciones: number;
}

export type TipoSangre = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';