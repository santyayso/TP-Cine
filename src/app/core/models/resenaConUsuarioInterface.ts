import { Resena } from "./resenaInterface";
export interface ResenaConUsuario extends Resena {
    usuarios: {
        nombre: string;
        apellido: string;
    };
}