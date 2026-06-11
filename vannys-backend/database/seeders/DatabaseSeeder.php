<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Catégories — upsert pour éviter les erreurs de doublons
        DB::table('categories')->upsert([
            ['name' => 'Électronique', 'slug' => 'electronics', 'icon' => 'laptop', 'color' => '#2196F3', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mode',         'slug' => 'fashion',     'icon' => 'tshirt', 'color' => '#673AB7', 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Beauté',       'slug' => 'beauty',      'icon' => 'spa',    'color' => '#FF4081', 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Maison',       'slug' => 'home',        'icon' => 'home',   'color' => '#4CAF50', 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ], ['slug'], ['name', 'icon', 'color', 'sort_order', 'updated_at']);

        // Compte admin — upsert pour éviter les doublons
        DB::table('users')->upsert([
            [
                'first_name'        => 'Admin',
                'last_name'         => 'Vanny',
                'email'             => 'admin@vannystouch.com',
                'password'          => Hash::make('Admin@2026!'),
                'phone'             => '+237 670000000',
                'role'              => 'admin',
                'is_active'         => true,
                'email_verified_at' => now(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
        ], ['email'], ['updated_at']);
    }
}
