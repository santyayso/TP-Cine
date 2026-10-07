import { Injectable, signal, computed, } from "@angular/core";
import { ButacaGenerada } from "../models/butacaGeneradaInterface";
import { TipoButaca } from "../models/butacaGeneradaInterface";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Supabase } from "./supabase";
import { inject } from "@angular/core";


const FILAS_COMUNES_1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const FILAS_COMUNES_2 = ['L', 'M', 'N', 'Ñ', 'O', 'P'];
const FILA_DISCAPACITADOS = ['J', 'K']
const FILAS_VIP = ['Q', 'R', 'S'];

export interface ButacaOcupada {
    id_butaca_vendida: number;
    fila_butaca: string;
    numero_butaca: number;
}


@Injectable({
    providedIn: 'root',
})
export class ButacasService {
    private supabaseService = inject(Supabase);

    generarMatrizButacas(): ButacaGenerada[][][] {
        let matrizButacas: ButacaGenerada[][][] = [];

        for (const fila of FILAS_COMUNES_1) {
            matrizButacas.push(this.generarBloquesPorFila(fila, [4, 20, 4], 'comun'));
        }

        for (const fila of FILA_DISCAPACITADOS) {
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

    private butacasOcupadasSignal = signal<ButacaOcupada[]>([]);
    butacasOcupadas = computed(() => this.butacasOcupadasSignal());

    private canal?: RealtimeChannel;

    async escucharButacasDeFuncion(idFuncion: number) {
        this.dejarDeEscuchar();
        this.butacasOcupadasSignal.set([]);

        
        this.canal = this.supabaseService.cliente
            .channel(`butacas-funcion-${idFuncion}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'butacas_vendidas', filter: `id_funcion=eq.${idFuncion}` },
                (payload) => {
                    const nueva = payload.new as ButacaOcupada;
                    this.butacasOcupadasSignal.update((lista) => {
                        const yaEsta = lista.some((butaca) => butaca.id_butaca_vendida === nueva.id_butaca_vendida);
                        return yaEsta ? lista : [...lista, nueva];
                    });
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'butacas_vendidas' },
                (payload) => {
                    const borrada = payload.old as { id_butaca_vendida: number };
                    this.butacasOcupadasSignal.update((lista) =>
                        lista.filter((butaca) => butaca.id_butaca_vendida !== borrada.id_butaca_vendida)
                    );
                }
            )
            .subscribe();

        await this.cargarButacasOcupadas(idFuncion);
    }

    private async cargarButacasOcupadas(idFuncion: number) {
        const { data, error } = await this.supabaseService.cliente
            .from('butacas_vendidas')
            .select('id_butaca_vendida, fila_butaca, numero_butaca')
            .eq('id_funcion', idFuncion);

        if (error) {
            console.error('Error al traer butacas ocupadas:', error);
            return;
        }

        this.butacasOcupadasSignal.set(data ?? []);
    }

    dejarDeEscuchar() {
        if (this.canal) {
            this.supabaseService.cliente.removeChannel(this.canal);
            this.canal = undefined;
        }
    }

}