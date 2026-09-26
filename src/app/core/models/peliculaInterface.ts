import { Funcion } from "./funcionInterface";
import { peliculaGeneroRelacion } from "./peliculaGeneroRelacion";

export interface Pelicula {
    id_pelicula: number
    duracion: number;
    portada: string;
    sinopsis: string;
    titulo: string;
    restriccion_edad: number | null;
    ya_estrenada_previamente: boolean;
    activo: boolean;
    funciones: Funcion[]
    pelicula_generos: peliculaGeneroRelacion[]
}