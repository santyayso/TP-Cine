import { Component, input } from '@angular/core';
import { Pelicula } from '../../core/models/peliculaInterface';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  imports: [DatePipe, CurrencyPipe, RouterLink],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html'
})
export class CardPelicula {
  pelicula = input.required<Pelicula>()
  leyendaPreventa = input<boolean>();
}
