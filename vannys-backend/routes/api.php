<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;

// ── Publiques ────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register',       [AuthController::class, 'register']);
    Route::post('login',          [AuthController::class, 'login']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('products',        [ProductController::class,  'index']);
Route::get('products/{slug}', [ProductController::class,  'show']);
Route::get('categories',      [CategoryController::class, 'index']);

// Webhook TalyPay (pas d'auth - appelé par TalyPay)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);

// ── TEST MAIL (temporaire) ───────────────────────────────────
Route::get('test-mail', function () {
    try {
        $user = \App\Models\User::first();
        \Illuminate\Support\Facades\Mail::to('pixelpagesaiadvisor@gmail.com')
            ->send(new \App\Mail\WelcomeMail($user));
        return response()->json([
            'status' => 'Email envoyé !',
            'mailer' => config('mail.default'),
            'from'   => config('mail.from.address'),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error'  => $e->getMessage(),
            'mailer' => config('mail.default'),
            'from'   => config('mail.from.address'),
        ], 500);
    }
});

// Route temporaire pour nettoyer les utilisateurs clients
Route::get('clear-test-users', function () {
    $count = \App\Models\User::where('role', '!=', 'admin')->delete();
    return response()->json(['deleted' => $count]);
});

// ── Authentifiées ────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout',     [AuthController::class, 'logout']);
    Route::get('auth/me',          [AuthController::class, 'me']);

    Route::get('orders',           [OrderController::class, 'index']);
    Route::post('orders',          [OrderController::class, 'store']);
    Route::get('orders/{order}',   [OrderController::class, 'show']);

    // Paiements
    Route::post('payments/init',            [PaymentController::class, 'init']);
    Route::get('payments/check/{ref}',      [PaymentController::class, 'check']);
});

// ── Admin ────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', IsAdmin::class])->prefix('admin')->group(function () {
    // Produits
    Route::post('products',             [ProductController::class, 'store']);
    Route::post('products/{product}',   [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);

    // Commandes
    Route::get('orders',                    [OrderController::class, 'adminIndex']);
    Route::patch('orders/{order}/status',   [OrderController::class, 'updateStatus']);

    // Clients
    Route::get('customers',                 [CustomerController::class, 'index']);
    Route::patch('customers/{user}/toggle', [CustomerController::class, 'toggle']);
});
