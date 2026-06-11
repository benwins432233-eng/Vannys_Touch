<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('cloudinary_id');
            $table->string('url', 500);
            $table->string('url_thumbnail', 500)->nullable();
            $table->string('url_medium', 500)->nullable();
            $table->string('alt_text')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->smallInteger('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};