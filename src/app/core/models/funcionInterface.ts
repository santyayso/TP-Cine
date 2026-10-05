export type IdiomaFuncion = 'castellano' | 'subtitulada';
export type FormatoFuncion = '2D' | '3D' | '4D';

export interface Funcion{
  id_funcion: number;
  id_pelicula: number;
  precio: number;
  id_sala: number;
  precio_preventa: number | null;
  puntos: number | null;
  fecha_hora: string;
  castellano_subtitulada: IdiomaFuncion;
  formato: FormatoFuncion;
  es_funcion_ancla: boolean;
  recargo_vip: number;
}


