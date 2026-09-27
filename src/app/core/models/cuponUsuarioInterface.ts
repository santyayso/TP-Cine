import { Cupon } from "./cuponInterface";

export interface CuponUsuario {
  id_cupon_usuario: number;
  id_usuario: string;
  id_cupon: number;
  usado: boolean;
  cupones: Cupon;  
}