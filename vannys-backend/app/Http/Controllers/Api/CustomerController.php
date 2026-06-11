<?php

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
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('first_name', 'like', "%$s%")
                ->orWhere('last_name',  'like', "%$s%")
                ->orWhere('email',      'like', "%$s%")
            );
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
