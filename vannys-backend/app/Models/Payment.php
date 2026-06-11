<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'payment_ref',
        'talypay_ref',
        'amount',
        'payment_method',
        'payment_mode',
        'status',
        'phone_number',
        'talypay_data',
    ];

    protected $casts = [
        'talypay_data' => 'array',
        'amount'       => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
