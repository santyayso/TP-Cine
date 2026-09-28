import { Injectable } from "@angular/core";
import { ButacaGenerada } from "../models/butacaGeneradaInterface";
import { TipoButaca } from "../models/butacaGeneradaInterface";

const FILAS_COMUNES_1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const FILAS_COMUNES_2 = ['L', 'M', 'N', 'Ñ', 'O', 'P'];
const FILA_DISCAPACITADOS = ['J', 'K']
const FILAS_VIP = ['Q', 'R', 'S'];

@Injectable({
    providedIn: 'root',
})
export class ButacasService {

    generarMatrizButacas(): ButacaGenerada[][][] {
        let matrizButacas: ButacaGenerada[][][] = [];

        for (const fila of FILAS_COMUNES_1) {
            matrizButacas.push(this.generarBloquesPorFila(fila, [4, 20, 4], 'comun'));
        }

        for (const fila  of FILA_DISCAPACITADOS){
            matrizButacas.push(this.generarBloquesPorFila(fila, [2, 10, 2], 'discapacitado'));
        }
        

        for (const fila of FILAS_COMUNES_2) {
            matrizButacas.push(this.generarBloquesPorFila(fila, [4, 20, 4], 'comun'));
        }

        for (const fila of FILAS_VIP) {
            matrizButacas.push(this.generarBloquesPorFila(fila, [4, 20, 4], 'vip'));
        }

        return matrizButacas;
    }

    private generarBloquesPorFila(fila: string, distribucionBloques: number[], tipo: TipoButaca): ButacaGenerada[][] {
        const bloquesDeLaFila: ButacaGenerada[][] = [];
        let numero = 1;

        for (const cantidadButacasPorBloque of distribucionBloques) {
            const bloque: ButacaGenerada[] = [];

            for (let i = 1; i <= cantidadButacasPorBloque; i++) {
                bloque.push({ fila, numero, tipo });
                numero++;
            }

            bloquesDeLaFila.push(bloque);
        }

        return bloquesDeLaFila;
    }
}