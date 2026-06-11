<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'order_id', 'product_id', 'product_name', 'product_image_url',
        'unit_price', 'quantity', 'subtotal',
        'variant_color', 'variant_size',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'quantity'    => 'integer',
        'subtotal'    => 'decimal:2',
        'created_at'  => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
