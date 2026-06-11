<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'delivery_full_name')) {
                $table->string('delivery_full_name', 100)->nullable()->after('phone_number');
            }
            if (!Schema::hasColumn('orders', 'delivery_phone')) {
                $table->string('delivery_phone', 30)->nullable()->after('delivery_full_name');
            }
            if (!Schema::hasColumn('orders', 'delivery_city')) {
                $table->string('delivery_city', 100)->nullable()->after('delivery_phone');
            }
            if (!Schema::hasColumn('orders', 'delivery_district')) {
                $table->string('delivery_district', 100)->nullable()->after('delivery_city');
            }
            if (!Schema::hasColumn('orders', 'delivery_address')) {
                $table->text('delivery_address')->nullable()->after('delivery_district');
            }
            if (!Schema::hasColumn('orders', 'delivery_landmark')) {
                $table->string('delivery_landmark', 255)->nullable()->after('delivery_address');
            }
            if (!Schema::hasColumn('orders', 'tracking_number')) {
                $table->string('tracking_number', 100)->nullable()->after('notes');
            }
        });

        // Modifier l'enum payment_method pour inclure CELTIIS
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('MTN','MOOV','ORANGE','CELTIIS') NOT NULL");
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $cols = ['delivery_full_name','delivery_phone','delivery_city','delivery_district','delivery_address','delivery_landmark','tracking_number'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('MTN','MOOV','ORANGE') NOT NULL");
    }
};
