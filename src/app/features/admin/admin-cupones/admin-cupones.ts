import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuponesService } from '../../../core/services/cupones-service';
import { Cupon } from '../../../core/models/cuponInterface';


@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-cupones',
  styleUrl: './admin-cupones.css',
  templateUrl: './admin-cupones.html',
})
export class AdminCupones {

}