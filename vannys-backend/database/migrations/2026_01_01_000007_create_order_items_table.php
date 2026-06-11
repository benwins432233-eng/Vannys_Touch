<?php
// ================================================================
// FICHIER : database/migrations/2026_01_01_000007_create_order_items_table.php
// ================================================================
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('product_name');           // snapshot nom au moment de la commande
            $table->string('product_image_url', 500)->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('subtotal', 12, 2);       // unit_price × quantity
            $table->string('variant_color', 50)->nullable();
            $table->string('variant_size', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('order_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};