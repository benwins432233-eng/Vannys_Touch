<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('payment_ref')->unique();
            $table->string('talypay_ref')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method'); // MTN, MOOV, CELTIIS
            $table->string('payment_mode');   // mtn_momo, moov_money, celtiis_cash
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
            $table->string('phone_number');
            $table->json('talypay_data')->nullable();
            $table->timestamps();
        });

        // Ajouter les colonnes payment_status et payment_ref à orders
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_ref')->nullable()->after('notes');
            $table->enum('payment_status', ['unpaid', 'pending', 'paid', 'failed'])
                  ->default('unpaid')->after('payment_ref');
            $table->string('tracking_number')->nullable()->after('payment_status');
            $table->decimal('total_amount', 12, 2)->nullable()->after('total');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_ref', 'payment_status', 'tracking_number', 'total_amount']);
        });
    }
};
