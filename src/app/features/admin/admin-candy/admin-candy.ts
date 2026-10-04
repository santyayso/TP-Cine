import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandyService } from '../../../core/services/candy-service';
import { ProductoCandy } from '../../../core/models/productoCandyInterface';
import { CurrencyPipe } from '@angular/common';
import { CategoriaCandy } from '../../../core/models/productoCandyInterface';
import { CATEGORIAS_CANDY } from '../../../core/services/candy-service';
import { Header } from '../../../layout/header/header';
import { Footer } from '../../../layout/footer/footer';
@Component({
  imports: [ReactiveFormsModule, CurrencyPipe, Header, Footer],
  selector: 'app-admin-candy',
  styleUrl: './admin-candy.css',
  templateUrl: './admin-candy.html',
})
export class AdminCandy implements OnInit, OnDestroy {
  private candyService = inject(CandyService);

  productos = signal<ProductoCandy[]>([]);
  categorias = CATEGORIAS_CANDY
  archivoImagen = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    categoria: new FormControl('', [Validators.required]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    puntos: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  get controles() {
    return this.formulario.controls;
  }

  async ngOnInit() {
    await this.recargarProductos()
  }

  async recargarProductos() {
    const lista = await this.candyService.obtenerProductosAdmin();
    this.productos.set(lista);
  }

  terminosBusqueda = signal<string>("")

  productosFiltrados = computed(() => {
    let productos = this.productos()

    if (!(this.terminosBusqueda().trim() == "")) {
      const arrayPalabras = this.terminosBusqueda()
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((palabra) => palabra != "")  // por si  escribe 2 espacios

      productos = productos.filter((producto) => {
        const palabrasNombre = producto.nombre.toLowerCase().split(" ")
        const palabrasCategoria = producto.categoria.toLowerCase().split(" ")

        return arrayPalabras.some((palabraBuscada) =>
          palabrasNombre.some((palabra) => palabra.startsWith(palabraBuscada)) ||
          palabrasCategoria.some((palabra) => palabra.startsWith(palabraBuscada))
        )
      })
    }

    return productos
  })

  productoEnEdicion = signal<ProductoCandy | null>(null);


  prepararEdicion(producto: ProductoCandy) {
    this.productoEnEdicion.set(producto);
    this.formulario.patchValue({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      puntos: producto.puntos
    });

    this.archivoImagen.set(null);
    this.previewUrl.set(producto.imagen);


  }

  terminarEdicion() {
    this.productoEnEdicion.set(null)
    this.formulario.reset()

    const preview = this.previewUrl();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.previewUrl.set(null);
    this.archivoImagen.set(null);

    const inputImagen = document.getElementById('imagen') as HTMLInputElement;
    if (inputImagen) {
      inputImagen.value = '';
    }
  }


  async guardar() {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return
    }

    if (!this.productoEnEdicion() && !this.archivoImagen()) {
      alert('Selecciona una imagen para el producto')
      return
    }

    const valores = this.formulario.getRawValue();


    const datos = {
      nombre: valores.nombre!,
      categoria: valores.categoria! as CategoriaCandy,
      precio: valores.precio!,
      puntos: valores.puntos,
      imagen: this.productoEnEdicion()?.imagen ?? ''
    };



    let verificacionSupaBase = false


    if (this.productoEnEdicion()) {
      verificacionSupaBase = await this.candyService.modificarProducto(this.productoEnEdicion()!.id_producto_candy, datos, this.archivoImagen());
    } else {
      verificacionSupaBase = await this.candyService.crearProducto(datos, this.archivoImagen()!);
    }


    if (!verificacionSupaBase) {
      alert('Ocurrió un error al guardar el producto')
      return;
    }

    if (this.productoEnEdicion()) {
      alert('Los cambios se guardaron correctamente')
    } else {
      alert('Producto creado con exito')
    }

    this.terminarEdicion();
    await this.recargarProductos();


  }

  async cambiarEstado(producto: ProductoCandy) {
    const verificacionSupaBase = await this.candyService.cambiarEstadoProducto(producto.id_producto_candy, !producto.activo);
    if (verificacionSupaBase) {
      await this.recargarProductos()

      if (producto.activo) {
        alert('El producto fue dado de baja correctamente')
      }
      else {
        alert('El producto se reactivó correctamente')
      }

    }


  }


  seleccionarArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const archivo = input.files[0];
    this.archivoImagen.set(archivo);

    const previewAnterior = this.previewUrl();
    if (previewAnterior) {
      URL.revokeObjectURL(previewAnterior);
    }

    this.previewUrl.set(URL.createObjectURL(archivo));
  }

  eliminarFotoSeleccionada() {
    const preview = this.previewUrl();
    if (this.archivoImagen() && preview) {
      URL.revokeObjectURL(preview);
    }

    this.archivoImagen.set(null);

    const producto = this.productoEnEdicion();
    if (producto) {
      this.previewUrl.set(producto.imagen);
    } else {
      this.previewUrl.set(null);
    }

    const inputImagen = document.getElementById('imagen') as HTMLInputElement;
    if (inputImagen) {
      inputImagen.value = '';
    }
  }

  ngOnDestroy(): void {
    const preview = this.previewUrl();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }


}
