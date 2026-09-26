export type TipoButaca = 'comun' | 'discapacitado' | 'vip';

export interface ButacaGenerada {
  fila: string;
  numero: number;
  tipo: TipoButaca;
}