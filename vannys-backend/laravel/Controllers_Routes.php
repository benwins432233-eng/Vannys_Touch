<?php
// ================================================================
// app/Http/Controllers/Api/AuthController.php
// ================================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/auth/register
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:8|confirmed',
            'phone'      => 'nullable|string|max:30',
        ]);

        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // POST /api/auth/logout
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    // GET /api/auth/me
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('orders'));
    }
}


// ================================================================
// app/Http/Controllers/Api/ProductController.php
// ================================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    // GET /api/products
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'images', 'variants'])
            ->where('is_active', true);

        // Filtres
        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }
        if ($request->filled('featured')) {
            $query->where('is_featured', true);
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Tri
        match($request->get('sort', 'default')) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating'     => $query->orderByDesc('rating'),
            'newest'     => $query->orderByDesc('created_at'),
            default      => $query->orderBy('sort_order')->orderByDesc('is_featured'),
        };

        $products = $query->paginate($request->get('per_page', 12));

        return response()->json($products);
    }

    // GET /api/products/{slug}
    public function show(string $slug): JsonResponse
    {
        $product = Product::with(['category', 'images', 'variants', 'reviews.user'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json($product);
    }

    // POST /api/admin/products  (admin uniquement)
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id'    => 'required|exists:categories,id',
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'badge'          => 'nullable|string|max:50',
            'in_stock'       => 'boolean',
            'is_featured'    => 'boolean',
            'colors'         => 'nullable|array',
            'colors.*'       => 'string|max:50',
            'sizes'          => 'nullable|array',
            'sizes.*'        => 'string|max:50',
            'images'         => 'required|array|min:1',
            'images.*'       => 'required|image|mimes:jpeg,png,webp|max:5120', // 5MB max
        ]);

        $product = Product::create([
            ...$data,
            'slug' => Str::slug($data['name']) . '-' . uniqid(),
        ]);

        // Upload images sur Cloudinary
        foreach ($request->file('images') as $index => $image) {
            $result = $this->cloudinary->upload($image, "vannys-touch/products/{$product->id}");

            $product->images()->create([
                'cloudinary_id' => $result['public_id'],
                'url'           => $result['secure_url'],
                'url_thumbnail' => $this->cloudinary->transform($result['public_id'], 300, 300),
                'url_medium'    => $this->cloudinary->transform($result['public_id'], 600, 600),
                'is_primary'    => $index === 0,
                'sort_order'    => $index,
            ]);
        }

        // Variantes
        foreach ($request->input('colors', []) as $color) {
            $product->variants()->create(['type' => 'color', 'value' => $color]);
        }
        foreach ($request->input('sizes', []) as $size) {
            $product->variants()->create(['type' => 'size', 'value' => $size]);
        }

        return response()->json(
            $product->load(['category', 'images', 'variants']),
            201
        );
    }

    // PUT /api/admin/products/{id}  (admin uniquement)
    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'category_id'    => 'sometimes|exists:categories,id',
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'badge'          => 'nullable|string|max:50',
            'in_stock'       => 'boolean',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'colors'         => 'nullable|array',
            'colors.*'       => 'string|max:50',
            'sizes'          => 'nullable|array',
            'sizes.*'        => 'string|max:50',
            'new_images'     => 'nullable|array',
            'new_images.*'   => 'image|mimes:jpeg,png,webp|max:5120',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . $product->id;
        }

        $product->update($data);

        // Nouvelles images
        if ($request->hasFile('new_images')) {
            $nextOrder = $product->images()->max('sort_order') + 1;
            foreach ($request->file('new_images') as $index => $image) {
                $result = $this->cloudinary->upload($image, "vannys-touch/products/{$product->id}");
                $product->images()->create([
                    'cloudinary_id' => $result['public_id'],
                    'url'           => $result['secure_url'],
                    'url_thumbnail' => $this->cloudinary->transform($result['public_id'], 300, 300),
                    'url_medium'    => $this->cloudinary->transform($result['public_id'], 600, 600),
                    'is_primary'    => false,
                    'sort_order'    => $nextOrder + $index,
                ]);
            }
        }

        // Remplacer les variantes si envoyées
        if ($request->has('colors') || $request->has('sizes')) {
            $product->variants()->delete();
            foreach ($request->input('colors', []) as $color) {
                $product->variants()->create(['type' => 'color', 'value' => $color]);
            }
            foreach ($request->input('sizes', []) as $size) {
                $product->variants()->create(['type' => 'size', 'value' => $size]);
            }
        }

        return response()->json($product->load(['category', 'images', 'variants']));
    }

    // DELETE /api/admin/products/{id}  (admin uniquement)
    public function destroy(Product $product): JsonResponse
    {
        // Supprimer les images Cloudinary
        foreach ($product->images as $image) {
            $this->cloudinary->delete($image->cloudinary_id);
        }
        $product->delete();

        return response()->json(['message' => 'Produit supprimé avec succès.']);
    }
}


// ================================================================
// app/Http/Controllers/Api/OrderController.php
// ================================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // GET /api/orders  (mes commandes)
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($orders);
    }

    // POST /api/orders
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'payment_method' => 'required|in:MTN,MOOV,ORANGE',
            'phone_number'   => 'required|string|max:30',
            'notes'          => 'nullable|string',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.color'      => 'nullable|string',
            'items.*.size'       => 'nullable|string',
        ]);

        // Calcul des montants
        $subtotal = 0;
        $orderItems = [];

        foreach ($data['items'] as $item) {
            $product = Product::with('images')->findOrFail($item['product_id']);
            $lineTotal = $product->price * $item['quantity'];
            $subtotal += $lineTotal;

            $orderItems[] = [
                'product_id'        => $product->id,
                'product_name'      => $product->name,
                'product_image_url' => $product->images->where('is_primary', true)->first()?->url,
                'unit_price'        => $product->price,
                'quantity'          => $item['quantity'],
                'subtotal'          => $lineTotal,
                'variant_color'     => $item['color'] ?? null,
                'variant_size'      => $item['size'] ?? null,
            ];
        }

        $order = Order::create([
            'user_id'        => $request->user()->id,
            'payment_method' => $data['payment_method'],
            'phone_number'   => $data['phone_number'],
            'notes'          => $data['notes'] ?? null,
            'subtotal'       => $subtotal,
            'shipping_fee'   => 0,
            'total'          => $subtotal,
        ]);

        $order->items()->createMany($orderItems);

        return response()->json($order->load('items'), 201);
    }

    // GET /api/admin/orders  (admin)
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('reference', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($q) => $q->where('first_name', 'like', "%{$request->search}%"));
        }

        return response()->json($query->paginate(15));
    }

    // PATCH /api/admin/orders/{id}/status  (admin)
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,processing,delivered,cancelled',
        ]);

        $order->update(['status' => $request->status]);

        return response()->json($order);
    }
}


// ================================================================
// app/Services/CloudinaryService.php
// ================================================================
namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Transformation\Resize;
use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    private Cloudinary $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary(config('cloudinary.url'));
    }

    // Upload un fichier et retourne les infos
    public function upload(UploadedFile $file, string $folder = 'vannys-touch'): array
    {
        $result = $this->cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder'         => $folder,
                'resource_type'  => 'image',
                'quality'        => 'auto',
                'fetch_format'   => 'auto',
            ]
        );

        return [
            'public_id'  => $result['public_id'],
            'secure_url' => $result['secure_url'],
            'width'      => $result['width'],
            'height'     => $result['height'],
        ];
    }

    // Génère une URL transformée (redimensionnée)
    public function transform(string $publicId, int $width, int $height): string
    {
        return $this->cloudinary->image($publicId)
            ->resize(Resize::fill($width, $height))
            ->toUrl();
    }

    // Supprimer une image
    public function delete(string $publicId): void
    {
        $this->cloudinary->uploadApi()->destroy($publicId);
    }
}


// ================================================================
// routes/api.php
// ================================================================
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;

// Auth
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });
});

// Produits publics
Route::get('products',       [ProductController::class, 'index']);
Route::get('products/{slug}', [ProductController::class, 'show']);

// Authentifié
Route::middleware('auth:sanctum')->group(function () {
    Route::get('orders',  [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
});

// Admin
Route::middleware(['auth:sanctum', IsAdmin::class])->prefix('admin')->group(function () {
    Route::apiResource('products', ProductController::class)
         ->except(['index', 'show']);
    Route::get('orders',                     [OrderController::class, 'adminIndex']);
    Route::patch('orders/{order}/status',    [OrderController::class, 'updateStatus']);
});


// ================================================================
// app/Http/Middleware/IsAdmin.php
// ================================================================
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        return $next($request);
    }
}
