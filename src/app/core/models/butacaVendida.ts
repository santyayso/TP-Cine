import { TipoButaca } from "./butacaGeneradaInterface";

export interface ButacaVendida {
  id_butaca_vendida: number;
  id_detalle_venta: number;
  id_funcion: number;
  fila_butaca: string;
  numero_butaca: number;
  tipo_butaca: TipoButaca;
  precio_pagado: number;
  es_canje: boolean;
}
