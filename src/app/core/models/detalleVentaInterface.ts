export interface DetalleVenta {
  id_detalle_venta: number;
  id_venta: number;
  codigo_qr: string;
  id_funcion: number | null;
  validacion_candy: boolean;
  validacion_entrada: boolean;
}