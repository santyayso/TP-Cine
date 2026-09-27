export interface Venta {
  id_venta: number;
  nombre: string;
  apellido: string;
  email: string;
  fecha_nacimiento: string;
  fecha_compra: string;
  total: number;
  id_usuario: string | null;
  id_cupon_aplicado: number | null;  
  estado: string;
  monto_efectivo: number;
  monto_credito: number;
}