export interface Resena {
    id_usuario: string;
    id_pelicula: number;
    calificacion: number;
    comentario: string | null;
    fecha_resena: string;
}