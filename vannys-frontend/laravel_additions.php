<?php
// ============================================================
// app/Http/Controllers/Api/NewsletterController.php
// ============================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterController extends Controller
{
    public function __construct(private EmailService $emailService) {}

    // POST /api/admin/newsletter
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'headline'    => 'required|string|max:255',
            'intro'       => 'required|string',
            'body'        => 'required|string',
            'cta_label'   => 'nullable|string|max:100',
            'cta_url'     => 'nullable|url',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        // Préparer les produits sélectionnés
        $products = [];
        if (!empty($data['product_ids'])) {
            $products = Product::whereIn('id', $data['product_ids'])
                ->with('images')
                ->get()
                ->map(fn($p) => [
                    'name'           => $p->name,
                    'slug'           => $p->slug,
                    'price'          => $p->price,
                    'original_price' => $p->original_price,
                    'image_url'      => $p->images->where('is_primary', true)->first()?->url
                                        ?? $p->images->first()?->url,
                    'badge'          => $p->badge,
                ])->toArray();
        }

        // Envoi en masse via queue (chunk de 100 pour ne pas surcharger)
        $count = 0;
        User::where('is_active', true)
            ->where('role', 'user')
            ->chunk(100, function ($users) use ($data, $products, &$count) {
                foreach ($users as $user) {
                    $this->emailService->sendNewsletter(
                        user:     $user,
                        subject:  $data['subject'],
                        headline: $data['headline'],
                        intro:    $data['intro'],
                        bodyText: $data['body'],
                        products: $products,
                        ctaLabel: $data['cta_label'] ?? 'Voir toutes les offres',
                        ctaUrl:   $data['cta_url'] ?? '',
                    );
                    $count++;
                }
            });

        return response()->json([
            'message' => "Newsletter mise en file d'attente pour {$count} clients.",
            'count'   => $count,
        ]);
    }
}


// ============================================================
// app/Http/Controllers/Api/CustomerController.php
// ============================================================
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    // GET /api/admin/customers
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount('orders')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->paginate(20));
    }

    // PATCH /api/admin/customers/:id/toggle
    public function toggle(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json([
            'message'   => $user->is_active ? 'Compte activé' : 'Compte désactivé',
            'is_active' => $user->is_active,
        ]);
    }
}


// ============================================================
// Ajouter dans routes/api.php (section admin)
// ============================================================
//
// Route::middleware(['auth:sanctum', IsAdmin::class])->prefix('admin')->group(function () {
//
//     // ... routes existantes ...
//
//     // Newsletter
//     Route::post('newsletter', [NewsletterController::class, 'send']);
//
//     // Clients
//     Route::get('customers',                    [CustomerController::class, 'index']);
//     Route::patch('customers/{user}/toggle',    [CustomerController::class, 'toggle']);
// });
