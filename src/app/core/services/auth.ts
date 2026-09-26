import { Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Auth {}