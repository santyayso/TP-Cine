import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { DatosComprador } from '../models/datosCompradorInterface';
import { Funcion } from '../models/funcionInterface';
import { Pelicula } from '../models/peliculaInterface';
import { CandyVendido } from '../models/candyVendidointerface';
import { ButacaGenerada } from '../models/butacaGeneradaInterface';
import { TipoButaca } from '../models/butacaGeneradaInterface';
import { VentasService } from './ventas-service';
import { inject } from '@angular/core';
import { AuthService } from './auth';
import { Cupon } from '../models/cuponInterface';
import { ButacaVendida } from '../models/butacaVendida';
import { CuponesService } from './cupones-service';
import { PeliculasService } from './peliculas-service';

@Injectable({
    providedIn: 'root',
})

export class CompraService {
    ventasService = inject(VentasService)
    authService = inject(AuthService)
    cuponesServices = inject(CuponesService)
    peliculasService = inject(PeliculasService)
    funcionSeleccionada = signal<Funcion | null>(null)
    datosComprador = signal<DatosComprador | null>(null)
    cantidadEntradas = signal<number>(1)
    peliculaSeleccionada = signal<Pelicula | null>(null)
    listaCandyVendidos = signal<CandyVendido[]>([]);
    codigoQrGenerado = signal<string>('')
    butacasSeleccionadas = signal<ButacaGenerada[]>([]);

    setearCandy(items: CandyVendido[]) {
        this.listaCandyVendidos.set(items);
        // console.log(this.listaCandyVendidos())
    }

    setearFuncion(funcion: Funcion) {
        this.funcionSeleccionada.set(funcion)

    }

    setearCantidadEntradas(cantidadEntradas: number) {
        this.cantidadEntradas.set(cantidadEntradas);

    }


    setearDatosComprador(datos: DatosComprador) {
        this.datosComprador.set(datos)

    }

    setearPelicula(pelicula: Pelicula) {
        this.peliculaSeleccionada.set(pelicula)
    }



    setearButacas(butacas: ButacaGenerada[]) {
        this.butacasSeleccionadas.set(butacas);
    }

    calcularPrecioButaca(tipoButaca: TipoButaca): number {
        const funcion = this.funcionSeleccionada();
        const pelicula = this.peliculaSeleccionada();
        if (!funcion || !pelicula) return 0;

        let precioBase = funcion.precio;

        if (this.peliculasService.perteneceAProximamente(pelicula) && funcion.precio_preventa != null) {
            precioBase = funcion.precio_preventa;
        }

        if (tipoButaca === 'vip') {
            return precioBase + funcion.recargo_vip;
        }

        return precioBase;
    }

    calcularTotalButacas(butacas: ButacaGenerada[]): number {
        let total = 0

        for (const butaca of butacas) {
            total += this.calcularPrecioButaca(butaca.tipo)
        }

        return total
    }


    private convertirFechaParaSupabase(fechaDDMMAAAA: string): string {
        const [dia, mes, anio] = fechaDDMMAAAA.split('/')
        return `${anio}-${mes}-${dia}`
    }



    async generarCompra(monto_efectivo: number, total: number, monto_credito: number, id_cupon_aplicado: number | null, id_cupon_usuario: number | null): Promise<boolean> {
        const datosComprador = this.datosComprador()
        if (!datosComprador) return false

        const funcion = this.funcionSeleccionada()
        const idFuncion = funcion?.id_funcion ?? null

        const idVenta = await this.ventasService.crearVenta({
            nombre: datosComprador.nombre,
            apellido: datosComprador.apellido,
            email: datosComprador.email,
            fecha_nacimiento: this.convertirFechaParaSupabase(datosComprador.fechaDeNacimiento),
            total: total,
            id_usuario: this.authService.currentUser()?.id ?? null,
            id_cupon_aplicado: id_cupon_aplicado,
            monto_efectivo: monto_efectivo,
            monto_credito: monto_credito,
        })

        if (!idVenta) return false

        const codigoQr = crypto.randomUUID()
        this.codigoQrGenerado.set(codigoQr)

        const idDetalleVenta = await this.ventasService.crearDetalleVenta(idVenta, codigoQr, idFuncion)

        if (!idDetalleVenta) return false;

        const filasButacas: Omit<ButacaVendida, 'id_butaca_vendida'>[] = [];

        for (const butaca of this.butacasSeleccionadas()) {
            filasButacas.push({
                id_detalle_venta: idDetalleVenta,
                id_funcion: idFuncion!,
                fila_butaca: butaca.fila,
                numero_butaca: butaca.numero,
                tipo_butaca: butaca.tipo,
                precio_pagado: this.calcularPrecioButaca(butaca.tipo),
                es_canje: false,
            })
        }

        if (filasButacas.length > 0) {
            const butacasCreadas = await this.ventasService.crearButacasVendidas(filasButacas)

            if (!butacasCreadas) {
            
                await this.ventasService.reembolsarVenta(idVenta)
                return false
            }
        }


        const filasCandy = this.listaCandyVendidos().map((producto) => ({
            id_detalle_venta: idDetalleVenta,
            id_producto_candy: producto.id_producto_candy,
            precio_pagado: producto.precio_pagado,
            cantidad: producto.cantidad,
            es_canje: producto.es_canje,

        }));

        await this.ventasService.crearCandyVendidos(filasCandy);


        if (id_cupon_usuario) {
            await this.cuponesServices.marcarCuponComoUsado(id_cupon_usuario);
        }


        if (monto_credito > 0) {
            const usuario = this.authService.currentUserData();
            if (usuario) {
                const nuevoSaldo = usuario.creditos_disponibles - monto_credito;
                await this.authService.actualizarCreditos(usuario.id, nuevoSaldo);
            }
        }

        return true
    }
}



