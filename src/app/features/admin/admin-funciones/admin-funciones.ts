import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuncionesService } from '../../../core/services/funciones-service';
import { PeliculasService } from '../../../core/services/peliculas-service';
import { Pelicula } from '../../../core/models/peliculaInterface';
import { Funcion, IdiomaFuncion, FormatoFuncion } from '../../../core/models/funcionInterface';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
import { DatePipe } from '@angular/common';

const PATRON_FECHA = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

@Component({
  imports: [ReactiveFormsModule, Header, Footer, DatePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  private route = inject(ActivatedRoute)
  private funcionesService = inject(FuncionesService)
  private peliculasService = inject(PeliculasService)

  idPelicula = Number(this.route.snapshot.paramMap.get('id'))

  pelicula = signal<Pelicula | null>(null)
  funcionesFuturas = signal<Funcion[]>([])

  yaPerteneceACatalogoGeneral = computed(() => {
    const pelicula = this.pelicula();
    if (!pelicula) {
      return false;
    }
    return this.peliculasService.perteneceACatalogoGeneral(pelicula);
  });

constructor() {
    effect(() => {
        const puedeUsarPreventa = this.tienePreventaActiva() && !this.yaPerteneceACatalogoGeneral();

        if (puedeUsarPreventa) {
            this.formularioFuncion.controls.precio_preventa.enable({ emitEvent: false });
            this.formularioRecurrente.controls.precio_preventa.enable({ emitEvent: false });
        } else {
            this.formularioFuncion.controls.precio_preventa.disable({ emitEvent: false });
            this.formularioRecurrente.controls.precio_preventa.disable({ emitEvent: false });
        }
    });
}
  async ngOnInit() {
    await this.recargarPelicula()
    await this.recargarFunciones()
  }

  async recargarPelicula() {
    this.pelicula.set(await this.peliculasService.obtenerPeliculaPorId(this.idPelicula))
  }

async recargarFunciones() {
    this.funcionesFuturas.set(await this.funcionesService.obtenerFuncionesFuturasDePelicula(this.idPelicula))
    await this.recargarPelicula()
}
  tienePreventaActiva = computed(() =>
    this.funcionesFuturas().some((funcion) => funcion.es_funcion_ancla)
  )

  terminosBusqueda = signal<string>("")

  funcionesFiltradas = computed(() => {
    let funciones = this.funcionesFuturas()

    if (!(this.terminosBusqueda().trim() == "")) {
      const termino = this.terminosBusqueda().trim().toLowerCase()

      funciones = funciones.filter((funcion) => {
        const fechaTexto = this.formatearFecha(new Date(funcion.fecha_hora)).toLowerCase()

        return fechaTexto.includes(termino)
          || funcion.castellano_subtitulada.toLowerCase().includes(termino)
          || funcion.formato.toLowerCase().includes(termino)
      })
    }

    return funciones
  })



  formularioFuncion = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    hora: new FormControl('', [Validators.required]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    precio_preventa: new FormControl<number | null>(null),
    recargo_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    castellano_subtitulada: new FormControl<IdiomaFuncion>('castellano', { nonNullable: true }),
    formato: new FormControl<FormatoFuncion>('2D', { nonNullable: true }),
  });

  get controlesFuncion() {
    return this.formularioFuncion.controls;
  }

  funcionEnEdicion = signal<Funcion | null>(null);

  prepararEdicionFuncion(funcion: Funcion) {
    this.funcionEnEdicion.set(funcion);

    const fecha = new Date(funcion.fecha_hora);

    this.formularioFuncion.patchValue({
      fecha: this.formatearFecha(fecha),
      hora: this.formatearHora(fecha),
      precio: funcion.precio,
      precio_preventa: funcion.precio_preventa,
      recargo_vip: funcion.recargo_vip,
      castellano_subtitulada: funcion.castellano_subtitulada,
      formato: funcion.formato,
    });
  }

  terminarEdicionFuncion() {
    this.funcionEnEdicion.set(null);
    this.formularioFuncion.reset({ castellano_subtitulada: 'castellano', formato: '2D' });
  }

  async guardarFuncion() {
    this.formularioFuncion.markAllAsTouched();
    if (this.formularioFuncion.invalid) {
      return
    }

    const valores = this.formularioFuncion.getRawValue();

    const fechaHora = this.parsearFechaTexto(valores.fecha!);
    const [horas, minutos] = valores.hora!.split(':').map(Number);
    fechaHora.setHours(horas, minutos, 0, 0);

    if (fechaHora <= new Date()) {
      alert('La fecha de la función debe ser futura')
      return
    }

    let precioPreventa: number | null = null
    if (this.tienePreventaActiva()) {
      precioPreventa = valores.precio_preventa
    }

    let verificacionSupaBase = false

    if (this.funcionEnEdicion()) {
      verificacionSupaBase = await this.funcionesService.modificarFuncion(
        this.funcionEnEdicion()!.id_funcion,
        this.idPelicula,
        this.pelicula()!.duracion,
        fechaHora,
        valores.precio!,
        precioPreventa,
        valores.recargo_vip!,
        valores.castellano_subtitulada,
        valores.formato
      )
    } else {
      verificacionSupaBase = await this.funcionesService.crearFuncion(
        this.idPelicula,
        this.pelicula()!.duracion,
        fechaHora,
        valores.precio!,
        precioPreventa,
        valores.recargo_vip!,
        valores.castellano_subtitulada,
        valores.formato
      )
    }

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al guardar la función')
      return;
    }

    if (this.funcionEnEdicion()) {
      alert('Los cambios se guardaron correctamente')
    } else {
      alert('Función creada con éxito')
    }

    this.terminarEdicionFuncion();
    await this.recargarFunciones()
  }

  async eliminarFuncionClick(funcion: Funcion) {
    const tieneEntradasVendidas = await this.funcionesService.tieneEntradasVendidas(funcion.id_funcion);

    if (tieneEntradasVendidas) {
      alert('No se puede eliminar esta función porque ya tiene entradas vendidas.')
      return
    }

    let mensaje = '¿Seguro que querés eliminar esta función?';

    if (funcion.es_funcion_ancla) {
      mensaje = 'Esta función marca la fecha de preventa. Si la eliminás, la preventa se va a reasignar automáticamente a la próxima función disponible. ¿Continuar?';
    }

    const confirmacion = confirm(mensaje);
    if (!confirmacion) {
      return
    }

    const verificacionSupaBase = await this.funcionesService.eliminarFuncion(funcion.id_funcion);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al eliminar la función')
      return;
    }

    await this.funcionesService.reasignarAnclaSiNecesario(this.idPelicula);

    alert('Función eliminada correctamente')
    await this.recargarFunciones()
  }



  diasSemanaOpciones = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' },
    { valor: 0, nombre: 'Domingo' },
  ];

  diasSemanaSeleccionados = signal<number[]>([]);

  formularioRecurrente = new FormGroup({
    hora: new FormControl('', [Validators.required]),
    fecha_desde: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    fecha_hasta: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    precio_preventa: new FormControl<number | null>(null),
    recargo_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    castellano_subtitulada: new FormControl<IdiomaFuncion>('castellano', { nonNullable: true }),
    formato: new FormControl<FormatoFuncion>('2D', { nonNullable: true }),
  });

  get controlesRecurrente() {
    return this.formularioRecurrente.controls;
  }

  alternarDiaSemana(dia: number) {
    const actuales = this.diasSemanaSeleccionados();

    if (actuales.includes(dia)) {
      this.diasSemanaSeleccionados.update((listaActual) => listaActual.filter(d => d !== dia));
    } else {
      this.diasSemanaSeleccionados.update((listaActual) => [...listaActual, dia]);
    }
  }

  async guardarFuncionesRecurrentes() {
    this.formularioRecurrente.markAllAsTouched();
    if (this.formularioRecurrente.invalid) {
      return
    }

    if (this.diasSemanaSeleccionados().length === 0) {
      alert('Selecciona al menos un día de la semana')
      return
    }

    const valores = this.formularioRecurrente.getRawValue();

    const fechaDesde = this.parsearFechaTexto(valores.fecha_desde!);
    const fechaHasta = this.parsearFechaTexto(valores.fecha_hasta!);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaDesde < hoy || fechaHasta < hoy) {
      alert('Las fechas deben ser futuras')
      return
    }

    if (fechaHasta < fechaDesde) {
      alert('La fecha hasta debe ser posterior a la fecha desde')
      return
    }

    const [horas, minutos] = valores.hora!.split(':').map(Number);

    let precioPreventa: number | null = null
    if (this.tienePreventaActiva()) {
      precioPreventa = valores.precio_preventa
    }

    const resultado = await this.funcionesService.crearFuncionesRecurrentes(
      this.idPelicula,
      this.pelicula()!.duracion,
      this.diasSemanaSeleccionados(),
      horas,
      minutos,
      fechaDesde,
      fechaHasta,
      valores.precio!,
      precioPreventa,
      valores.recargo_vip!,
      valores.castellano_subtitulada,
      valores.formato
    )

    if (!resultado.exito) {
      if (resultado.fechaFallida) {
        alert(`No hay salas disponibles para la función del ${resultado.fechaFallida.toLocaleDateString()}. No se creó ninguna función.`)
      } else {
        alert('Ocurrió un error al crear las funciones')
      }
      return;
    }

    alert('Funciones creadas con éxito')
    this.formularioRecurrente.reset({ castellano_subtitulada: 'castellano', formato: '2D' })
    this.diasSemanaSeleccionados.set([])
    await this.recargarFunciones()
  }


  formularioPreventa = new FormGroup({
    precio_preventa: new FormControl<number | null>(null),
  });

  async guardarPreventa() {
    const valores = this.formularioPreventa.getRawValue();

    const verificacionSupaBase = await this.funcionesService.configurarPreventa(this.idPelicula, valores.precio_preventa);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al configurar la preventa')
      return;
    }

    alert('Preventa configurada con éxito')
    this.formularioPreventa.reset()
    await this.recargarFunciones()
  }

  async desactivarPreventaClick() {
    const confirmacion = confirm('¿Seguro que querés desactivar la preventa? Se van a borrar los precios de preventa ya cargados en las funciones futuras.')
    if (!confirmacion) {
      return
    }

    const verificacionSupaBase = await this.funcionesService.desactivarPreventa(this.idPelicula)

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al desactivar la preventa')
      return;
    }

    alert('Preventa desactivada correctamente')
    await this.recargarFunciones()
  }



  private parsearFechaTexto(fechaTexto: string): Date {
    const [dia, mes, anio] = fechaTexto.split('/').map((texto) => Number(texto));
    return new Date(anio, mes - 1, dia);
  }

  private formatearFecha(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  private formatearHora(fecha: Date): string {
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  }

}