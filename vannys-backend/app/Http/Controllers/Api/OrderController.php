<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AdminNewOrderMail;
use App\Mail\OrderConfirmedMail;
use App\Mail\OrderShippedMail;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    // GET /api/orders  (commandes du client connecté)
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['items'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($orders);
    }

    // POST /api/orders
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'payment_method'       => 'required|in:MTN,MOOV,ORANGE,CELTIIS',
            'phone_number'         => 'required|string|max:30',
            'notes'                => 'nullable|string',

            // Infos livraison
            'delivery_full_name'   => 'required|string|max:100',
            'delivery_phone'       => 'required|string|max:30',
            'delivery_city'        => 'required|string|max:100',
            'delivery_district'    => 'required|string|max:100',
            'delivery_address'     => 'required|string|max:500',
            'delivery_landmark'    => 'nullable|string|max:255',

            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.color'        => 'nullable|string',
            'items.*.size'         => 'nullable|string',
        ]);

        $subtotal   = 0;
        $orderItems = [];

        foreach ($data['items'] as $item) {
            $product   = Product::with('images')->findOrFail($item['product_id']);
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

        $shippingFee = $subtotal >= 50000 ? 0 : 2500;

        $order = Order::create([
            'user_id'            => $request->user()->id,
            'payment_method'     => $data['payment_method'],
            'phone_number'       => $data['phone_number'],
            'notes'              => $data['notes'] ?? null,
            'subtotal'           => $subtotal,
            'shipping_fee'       => $shippingFee,
            'total'              => $subtotal + $shippingFee,

            // Livraison
            'delivery_full_name' => $data['delivery_full_name'],
            'delivery_phone'     => $data['delivery_phone'],
            'delivery_city'      => $data['delivery_city'],
            'delivery_district'  => $data['delivery_district'],
            'delivery_address'   => $data['delivery_address'],
            'delivery_landmark'  => $data['delivery_landmark'] ?? null,
        ]);

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        $order->load(['items', 'user']);

        // Email de confirmation au client
        try {
            Mail::to($order->user->email)->send(new OrderConfirmedMail($order));
        } catch (\Exception $e) {
            \Log::error('OrderConfirmedMail failed: ' . $e->getMessage());
        }

        // Notification admin avec tous les détails
        try {
            Mail::to(config('mail.admin_address', 'pixelpagesaiadvisor@gmail.com'))
                ->send(new AdminNewOrderMail($order));
        } catch (\Exception $e) {
            \Log::error('AdminNewOrderMail failed: ' . $e->getMessage());
        }

        return response()->json($order, 201);
    }

    // GET /api/admin/orders
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('reference', 'like', '%' . $request->search . '%')
                ->orWhereHas('user', fn($q) => $q
                    ->where('first_name', 'like', '%' . $request->search . '%')
                    ->orWhere('last_name',  'like', '%' . $request->search . '%')
                );
        }

        return response()->json($query->paginate(20));
    }

    // PATCH /api/admin/orders/:id/status
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status'          => 'required|in:pending,processing,shipped,delivered,cancelled',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $oldStatus = $order->status;

        $order->update([
            'status'          => $request->status,
            'tracking_number' => $request->tracking_number ?? $order->tracking_number,
        ]);

        $order->load(['user', 'items']);

        if ($request->status === 'shipped' && $oldStatus !== 'shipped') {
            try {
                Mail::to($order->user->email)->send(new OrderShippedMail($order));
            } catch (\Exception $e) {
                \Log::error('OrderShippedMail failed: ' . $e->getMessage());
            }
        }

        return response()->json($order);
    }

    // GET /api/orders/:id
    public function show(Request $request, Order $order): JsonResponse
    {
        if (!$request->user()->is_admin && $order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json($order->load(['items', 'user']));
    }
}
