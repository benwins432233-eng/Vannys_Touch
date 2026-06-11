<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description',
        'price', 'original_price', 'badge', 'rating',
        'reviews_count', 'in_stock', 'is_featured',
        'is_active', 'sort_order',
    ];

    protected $casts = [
        'price'          => 'decimal:2',
        'original_price' => 'decimal:2',
        'rating'         => 'decimal:1',
        'reviews_count'  => 'integer',
        'in_stock'       => 'boolean',
        'is_featured'    => 'boolean',
        'is_active'      => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function colors(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('type', 'color');
    }

    public function sizes(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('type', 'size');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_visible', true);
    }

    public function recalculateRating(): void
    {
        $avg = $this->reviews()->avg('rating') ?? 0;
        $this->update([
            'rating'        => round($avg, 1),
            'reviews_count' => $this->reviews()->count(),
        ]);
    }
}
