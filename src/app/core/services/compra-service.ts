import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { DatosComprador } from '../models/datosCompradorInterface';
import { Funcion } from '../models/funcionInterface';
import { Pelicula } from '../models/peliculaInterface';
import { CandyVendido } from '../models/candyVendidointerface';
import { ButacaGenerada } from '../models/butacaGeneradaInterface';
import { TipoButaca } from '../models/butacaGeneradaInterface';

@Injectable({
    providedIn: 'root',
})

export class CompraService {
    funcionSeleccionada = signal<Funcion | null>(null)
    datosComprador = signal<DatosComprador | null>(null)
    cantidadEntradas = signal<number>(1)
    peliculaSeleccionada = signal<Pelicula | null>(null)
    listaCandyVendidos = signal<CandyVendido[]>([]);
    butacasSeleccionadas = signal<ButacaGenerada[]>([]);

    setearCandy(items: CandyVendido[]) {
        this.listaCandyVendidos.set(items);
        console.log(this.listaCandyVendidos())
    }

    setearFuncion(funcion: Funcion) {
        this.funcionSeleccionada.set(funcion)

    }

    setearCantidadEntradas(cantidadEntradas: number) {
        this.cantidadEntradas.set(cantidadEntradas);

    }


    setearDatosComprador(datos: DatosComprador) {
        this.datosComprador.set(datos)
        // console.log(datos)

    }

    setearPelicula(pelicula: Pelicula) {
        this.peliculaSeleccionada.set(pelicula)
    }



    setearButacas(butacas: ButacaGenerada[]) {
        this.butacasSeleccionadas.set(butacas);
        // console.log(this.butacasSeleccionadas())
    }

    calcularPrecioButaca(tipoButaca: TipoButaca): number {
        const funcion = this.funcionSeleccionada();
        if (!funcion) return 0;

        const precioBase = funcion.precio_preventa ?? funcion.precio;

        if (tipoButaca === 'vip') {
            return precioBase + funcion.recargo_vip;
        }

        return precioBase;
    }

    calcularTotalButacas(butacas: ButacaGenerada[]): number{
        let total = 0

        for (const butaca of butacas){
            total += this.calcularPrecioButaca(butaca.tipo)
        }

        return total
    }


}
