import { Component, OnInit, inject, signal, computed, effect, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuncionesService } from '../../../core/services/funciones-service';
import { PeliculasService } from '../../../core/services/peliculas-service';
import { Pelicula } from '../../../core/models/peliculaInterface';
import { Funcion, IdiomaFuncion, FormatoFuncion } from '../../../core/models/funcionInterface';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
import { DatePipe, formatDate } from '@angular/common';

const PATRON_FECHA = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const PATRON_HORA = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

@Component({
  imports: [ReactiveFormsModule, Header, Footer, DatePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  private funcionesService = inject(FuncionesService)
  private peliculasService = inject(PeliculasService)

  // el id de la pelicula viene en la ruta: /admin/peliculas/:id/funciones
  id = input.required<string>()
  idPelicula = computed(() => Number(this.id()))


  pelicula = signal<Pelicula | null>(null)
  funcionesFuturas = signal<Funcion[]>([])

  // recargamos tambien la pelicula porque trae sus funciones, y de ahi sale si ya pertenece al catalogo general
  async recargarFunciones() {
    this.pelicula.set(await this.peliculasService.obtenerPeliculaPorId(this.idPelicula()))
    this.funcionesFuturas.set(await this.funcionesService.obtenerFuncionesFuturasDePelicula(this.idPelicula()))
  }


  async ngOnInit() {
    await this.recargarFunciones()
  }



  // boolean para saber si tiene preventa activa, mirando si alguna de las funciones futuras es ancla
  tienePreventaActiva = computed(() =>
    this.funcionesFuturas().some((funcion) => funcion.es_funcion_ancla)
  )

    // si la pelicula ya se estreno (catalogo general) no se puede aplicar preventa, asi que el computed se setea en true
  yaPerteneceACatalogoGeneral = computed(() => {
    const pelicula = this.pelicula();
    if (!pelicula) {
      return false;
    }
    return this.peliculasService.perteneceACatalogoGeneral(pelicula);
  });


  constructor() {
    // habilita o deshabilita el campo "precio preventa" de los 2 formularios segun si se puede usar la preventa
    effect(() => {
      const puedeUsarPreventa = this.tienePreventaActiva() && !this.yaPerteneceACatalogoGeneral();

      if (puedeUsarPreventa) {
        this.formularioFuncion.controls.precio_preventa.enable();
        this.formularioRecurrente.controls.precio_preventa.enable();
      } else {
        this.formularioFuncion.controls.precio_preventa.disable();
        this.formularioRecurrente.controls.precio_preventa.disable();
      }
    });
  }








  // =====================
  // FORM PARA CREAR UNA SOLA FUNCION
  // =====================
  formularioFuncion = new FormGroup({
    fecha: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    hora: new FormControl('', [Validators.required, Validators.pattern(PATRON_HORA)]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    precio_preventa: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    recargo_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    castellano_subtitulada: new FormControl<IdiomaFuncion>('castellano', { nonNullable: true }),
    formato: new FormControl<FormatoFuncion>('2D', { nonNullable: true }),
  });

  get controlesFuncion() {
    return this.formularioFuncion.controls;
  }


  
  // =====================
  // FORM DE UNA SOLA FUNCION: EDITAR 
  // =====================

  // creamos este signal que guarda null si se esta creando, y si se esta editando guarda la misma funcion en si
  funcionEnEdicion = signal<Funcion | null>(null);

  async prepararFormParaEdicion(funcion: Funcion) {
    // si la funcion ya tiene entradas vendidas no dejamos editarla
    const tieneEntradasVendidas = await this.funcionesService.tieneEntradasVendidas(funcion.id_funcion);

    if (tieneEntradasVendidas) {
      alert('No se puede editar esta función porque ya tiene entradas vendidas.')
      return
    }

    // seteamos el signal con la funcion que se esta editando
    this.funcionEnEdicion.set(funcion);

     // viene de supabase como un string largo, la pase a Date y la formateo para pasarla a un string mas  corto
    const fechaFormateada = formatDate(new Date(funcion.fecha_hora),  'dd/MM/yyyy', 'en-US');
    const horaFormateada =  formatDate(new Date(funcion.fecha_hora), 'HH:mm', 'en-US');

    this.formularioFuncion.patchValue({
      fecha: fechaFormateada,
      hora: horaFormateada,
      precio: funcion.precio,
      precio_preventa: funcion.precio_preventa,
      recargo_vip: funcion.recargo_vip,
      castellano_subtitulada: funcion.castellano_subtitulada,
      formato: funcion.formato,
    });
  }


  // =====================
  // FORM DE UNA SOLA FUNCION: RESETEO
  // =====================
  // lo llamamos despues de guardar, al cancelar una edicion o al limpiar un formulario, para resetear
  resetearForm() {
    this.funcionEnEdicion.set(null);
    this.formularioFuncion.reset({ castellano_subtitulada: 'castellano', formato: '2D' });
  }


  // =====================
  // FORM DE UNA SOLA FUNCION: GUARDADO, SIRVE TANTO PARA EDITAR COMO PARA CREAR
  // =====================

  // guardar funcion (sirve tanto para editar como para crear)
  async guardarFuncion() {
    this.formularioFuncion.markAllAsTouched();
    if (this.formularioFuncion.invalid) {
      return
    }

    const valores = this.formularioFuncion.getRawValue();

    // juntamos la fecha (texto DD/MM/AAAA) y la hora (texto HH:MM) en un solo Date
    const fechaHora = this.parsearFechaParaSB(valores.fecha!);
    const [horas, minutos] = valores.hora!.split(':').map(Number);

    // seteamos las horas y minutos del form y los segundos y milisegundos en 0
    fechaHora.setHours(horas, minutos, 0, 0);

    // la funcion tiene que ser futura
    if (fechaHora <= new Date()) {
      alert('La fecha de la función debe ser futura')
      return
    }

    // el precio de preventa solo se guarda si la preventa esta activa (igualmente el campo estaría deshabilitado, pero es una validacionn extra)
    let precioPreventa: number | null = null
    if (this.tienePreventaActiva()) {
      precioPreventa = valores.precio_preventa
    }

    let verificacionSupaBase = false

    if (this.funcionEnEdicion()) {
      const funcionModificada = {
        id_funcion: this.funcionEnEdicion()!.id_funcion,
        id_pelicula: this.idPelicula(),
        precio: valores.precio!,
        precio_preventa: precioPreventa,
        puntos: this.funcionEnEdicion()!.puntos,
        fecha_hora: fechaHora.toISOString(),
        castellano_subtitulada: valores.castellano_subtitulada,
        formato: valores.formato,
        recargo_vip: valores.recargo_vip!,
      }

      verificacionSupaBase = await this.funcionesService.modificarFuncion(funcionModificada, this.pelicula()!.duracion)
    } else {
      const funcionNueva = {
        id_pelicula: this.idPelicula(),
        precio: valores.precio!,
        precio_preventa: precioPreventa,
        puntos: null,
        fecha_hora: fechaHora.toISOString(),
        castellano_subtitulada: valores.castellano_subtitulada,
        formato: valores.formato,
        recargo_vip: valores.recargo_vip!,
      }

      verificacionSupaBase = await this.funcionesService.crearFuncion(funcionNueva, this.pelicula()!.duracion)
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

    this.resetearForm();
    await this.recargarFunciones()
  }







  // =====================
  // FORM PARA CREAR FUNCIONES RECURRENTES
  // =====================

  // el valor es el numero que devuelve getDay() (0 = domingo)
  diasSemanaOpciones = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' },
    { valor: 0, nombre: 'Domingo' },
  ];


  formularioRecurrente = new FormGroup({
    hora: new FormControl('', [Validators.required, Validators.pattern(PATRON_HORA)]),
    fecha_desde: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    fecha_hasta: new FormControl('', [Validators.required, Validators.pattern(PATRON_FECHA)]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    precio_preventa: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    recargo_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    castellano_subtitulada: new FormControl<IdiomaFuncion>('castellano', { nonNullable: true }),
    formato: new FormControl<FormatoFuncion>('2D', { nonNullable: true }),
  });

  get controlesRecurrente() {
    return this.formularioRecurrente.controls;
  }

  // signal para manejar los checkbox y saber que dias marcó
  diasSemanaSeleccionados = signal<number[]>([]);

  // funcion para manejar el marcado de los checkboxes
  alternarDiaSemana(dia: number) {
    const actuales = this.diasSemanaSeleccionados();

    if (actuales.includes(dia)) {
      this.diasSemanaSeleccionados.update((listaActual) => listaActual.filter((d) => d !== dia));
    } else {
      this.diasSemanaSeleccionados.update((listaActual) => [...listaActual, dia]);
    }
  }

  // ====================================
  // FORM DE FUNCIONES RECURRENTES: RESTEO
  // ======================================

  // limpia el form de recurrentes y destilda los dias de la semana, despues de guardar o si tocamos el boton de limpiar
  resetearFormRecurrente() {
    this.formularioRecurrente.reset({ castellano_subtitulada: 'castellano', formato: '2D' })
    this.diasSemanaSeleccionados.set([])
  }

 // ====================================
  // FORM DE FUNCIONES RECURRENTES: GUARDADO (en este caso solo existe la creacion y no la edicion)
  // ======================================

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

    const fechaDesde = this.parsearFechaParaSB(valores.fecha_desde!);
    const fechaHasta = this.parsearFechaParaSB(valores.fecha_hasta!);
    const [horas, minutos] = valores.hora!.split(':').map(Number);

    // la primera fecha (desde + la hora elegida) tiene que ser futura
    // si la primera es futura, todas las demas tambien lo son
    const fechaDesdeConHora = new Date(fechaDesde);
    fechaDesdeConHora.setHours(horas, minutos, 0, 0);

    if (fechaDesdeConHora <= new Date()) {
      alert('La fecha y hora de inicio deben ser futuras')
      return
    }

    if (fechaHasta < fechaDesde) {
      alert('La fecha hasta no puede ser anterior a la fecha desde')
      return
    }

    // el precio de preventa solo se guarda si la preventa esta activa (igualmente si no hay preventa, los campos deberian estar deshabilitados)
    let precioPreventa: number | null = null
    if (this.tienePreventaActiva()) {
      precioPreventa = valores.precio_preventa
    }

    // los datos que comparten TODAS las funciones que se van a crear
    // la fecha_hora de cada una la calcula el service, por eso aca no se usa
    const funcionBase = {
      id_pelicula: this.idPelicula(),
      precio: valores.precio!,
      precio_preventa: precioPreventa,
      puntos: null,
      castellano_subtitulada: valores.castellano_subtitulada,
      formato: valores.formato,
      recargo_vip: valores.recargo_vip!,
    }

    const resultado = await this.funcionesService.crearFuncionesRecurrentes(
      funcionBase,
      this.idPelicula(),
      this.pelicula()!.duracion,
      this.diasSemanaSeleccionados(),
      horas,
      minutos,
      fechaDesde,
      fechaHasta
    )

    if (!resultado.exito) {
      if (resultado.fechaFallida) {
        alert(`No hay salas disponibles para la función del ${resultado.fechaFallida.toLocaleDateString()}. No se creó ninguna función.`)
      } else {
        alert('Ocurrió un error al crear las funciones. Revisá que los días elegidos caigan dentro del rango de fechas.')
      }
      return;
    }

    alert('Funciones creadas con éxito')
    this.resetearFormRecurrente()
    await this.recargarFunciones()
  }



  // =====================
  // FORM PARA PREVENTA
  // =====================

  formularioPreventa = new FormGroup({
    precio_preventa: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

get controlesPreventa() {
  return this.formularioPreventa.controls;
}

  async guardarPreventa() {

    this.formularioPreventa.markAllAsTouched();
    if (this.formularioPreventa.invalid) {
      return
    }

   

    const valores = this.formularioPreventa.getRawValue();

    const verificacionSupaBase = await this.funcionesService.configurarPreventa(this.idPelicula(), valores.precio_preventa!);

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al configurar la preventa')
      return;
    }

    alert('Preventa configurada con éxito')
    this.formularioPreventa.reset()
    await this.recargarFunciones()
  }


  async desactivarPreventa() {
    const confirmacion = confirm('¿Seguro que querés desactivar la preventa? Se van a borrar los precios de preventa ya cargados en las funciones futuras.')
    if (!confirmacion) {
      return
    }

    const verificacionSupaBase = await this.funcionesService.desactivarPreventa(this.idPelicula())

    if (!verificacionSupaBase) {
      alert('Ocurrió un error al desactivar la preventa')
      return;
    }

    alert('Preventa desactivada correctamente')
    await this.recargarFunciones()
  }




  // =====================
  // BUSCADOR DE LA TABLA
  // =====================

  terminosBusqueda = signal<string>("")

  funcionesFiltradas = computed(() => {
    let funciones = this.funcionesFuturas()

    if (!(this.terminosBusqueda().trim() == "")) {
      const termino = this.terminosBusqueda().trim().toLowerCase()

      funciones = funciones.filter((funcion) => {


        // viene de supabase como un string largo, la pase a Date y la formateo para pasarla a un string mas  corto
        const fechaFormateada = formatDate(new Date(funcion.fecha_hora), 'dd/MM/yyyy', 'en-US')
        const horaFormateada = formatDate(new Date(funcion.fecha_hora), 'HH:mm', 'en-US')

        return fechaFormateada.includes(termino)
          || horaFormateada.includes(termino)
          || funcion.castellano_subtitulada.toLowerCase().includes(termino)
          || funcion.formato.toLowerCase().includes(termino)
      })
    }

    return funciones
  })


  // =====================
  // ELIMINAR UNA FUNCION (DE LA TABLA)
  // =====================

  async eliminarFuncionClick(funcion: Funcion) {

    const tieneEntradasVendidas = await this.funcionesService.tieneEntradasVendidas(funcion.id_funcion);

    // si la funcion ya tiene entradas vendidas no dejamos eliminarla
    if (tieneEntradasVendidas) {
      alert('No se puede eliminar esta función porque ya tiene entradas vendidas.')
      return
    }

    let mensaje = '¿Seguro que querés eliminar esta función?';

    if (funcion.es_funcion_ancla) {
      mensaje += '\nEsta función marca la fecha límite de la preventa. Si la eliminás, la preventa se va a reasignar automáticamente a la próxima función disponible.';
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

    // solo reasignamos la ancla si la funcion que borramos ERA la ancla
    // (si no, estariamos activando una preventa en una pelicula que no la tenia)
    if (funcion.es_funcion_ancla) {
      await this.funcionesService.reasignarAnclaSiNecesario(this.idPelicula());
    }

    alert('Función eliminada correctamente')
    await this.recargarFunciones()
  }




  // ===============================================================
  // FUNCION AUXILIAR PARA PASAR DE STRING A DATE Y PODER GUARDARLO EN SUPABASE
  // ===============================================================

  // "15/03/2026" -> Date (el mes va con -1 porque en JS enero es 0)
  private parsearFechaParaSB(fechaTexto: string): Date {
    const [dia, mes, anio] = fechaTexto.split('/').map((texto) => Number(texto));
    return new Date(anio, mes - 1, dia);
  }








}













