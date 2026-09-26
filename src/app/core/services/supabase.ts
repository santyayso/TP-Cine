import { Injectable } from '@angular/core';
import { enviroment } from '../../../enviroments/enviroments';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root',
})
export class Supabase {

    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(enviroment.supabase.url, enviroment.supabase.publicKey)
    }

    get cliente(): SupabaseClient {
        return this.supabase;
    }
}