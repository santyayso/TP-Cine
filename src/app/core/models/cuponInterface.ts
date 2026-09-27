export interface Cupon {
  id_cupon: number;
  nombre: string;
  porcentaje: number;
  edad_minima: number | null;
  automatico: boolean;
  activo: boolean;
}