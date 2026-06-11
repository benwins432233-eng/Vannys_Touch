<?php
// ================================================================
// app/Models/Category.php
// ================================================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name', 'slug', 'icon', 'description',
        'color', 'image_url', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // Un produit count dynamique via la relation
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function activeProducts(): HasMany
    {
        return $this->hasMany(Product::class)->where('is_active', true);
    }
}


// ================================================================
// app/Models/Product.php
// ================================================================
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

    // Relation : catégorie
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Relation : toutes les images
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    // Image principale (la première marquée is_primary)
    public function primaryImage(): HasMany
    {
        return $this->hasMany(ProductImage::class)->where('is_primary', true)->limit(1);
    }

    // Variantes (couleurs + tailles)
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

    // Avis clients
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_visible', true);
    }

    // Accesseur : URL image principale
    public function getImageUrlAttribute(): ?string
    {
        return $this->images->where('is_primary', true)->first()?->url
            ?? $this->images->first()?->url;
    }

    // Recalculer le rating moyen après un avis
    public function recalculateRating(): void
    {
        $avg = $this->reviews()->avg('rating') ?? 0;
        $this->update([
            'rating'        => round($avg, 1),
            'reviews_count' => $this->reviews()->count(),
        ]);
    }
}


// ================================================================
// app/Models/ProductImage.php
// ================================================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    public $timestamps = false;         // seulement created_at
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'product_id', 'cloudinary_id', 'url',
        'url_thumbnail', 'url_medium', 'alt_text',
        'is_primary', 'sort_order',
    ];

    protected $casts = [
        'is_primary'  => 'boolean',
        'sort_order'  => 'integer',
        'created_at'  => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}


// ================================================================
// app/Models/ProductVariant.php
// ================================================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = ['product_id', 'type', 'value'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}


// ================================================================
// app/Models/User.php
// ================================================================
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'password',
        'phone', 'role', 'avatar_url', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Accesseur : nom complet
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}


// ================================================================
// app/Models/Order.php
// ================================================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'reference', 'status', 'payment_method',
        'phone_number', 'subtotal', 'shipping_fee', 'total', 'notes',
    ];

    protected $casts = [
        'subtotal'     => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total'        => 'decimal:2',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    // Génère la référence automatiquement avant création
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->reference = 'VT-' . str_pad(
                Order::max('id') + 1, 5, '0', STR_PAD_LEFT
            );
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


// ================================================================
// app/Models/OrderItem.php
// ================================================================
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
        'unit_price' => 'decimal:2',
        'quantity'   => 'integer',
        'subtotal'   => 'decimal:2',
        'created_at' => 'datetime',
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


// ================================================================
// app/Models/Review.php
// ================================================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'product_id', 'user_id', 'rating', 'comment', 'is_visible',
    ];

    protected $casts = [
        'rating'     => 'integer',
        'is_visible' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Recalcule le rating du produit après sauvegarde/suppression
    protected static function booted(): void
    {
        static::saved(fn(Review $r) => $r->product->recalculateRating());
        static::deleted(fn(Review $r) => $r->product->recalculateRating());
    }
}
