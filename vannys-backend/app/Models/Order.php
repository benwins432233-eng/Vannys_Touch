<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Order extends Model
{
    protected $fillable = [
        'user_id', 'reference', 'status', 'payment_method',
        'phone_number', 'subtotal', 'shipping_fee', 'total', 'notes',
        'tracking_number',
        'delivery_full_name', 'delivery_phone', 'delivery_city',
        'delivery_district', 'delivery_address', 'delivery_landmark',
    ];
    protected $casts = [
        'subtotal'     => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total'        => 'decimal:2',
    ];
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $lastId = Order::max('id') ?? 0;
            $order->reference = 'VT-' . str_pad($lastId + 1, 5, '0', STR_PAD_LEFT);
        });
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
