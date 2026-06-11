<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\WelcomeMail;
use App\Mail\AdminNewUserMail;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

        // Email de bienvenue au nouvel utilisateur
        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
        } catch (\Exception $e) {
            \Log::error('WelcomeMail failed: ' . $e->getMessage());
        }

        // Notification admin
        try {
            Mail::to(config('mail.admin_address', 'pixelpagesaiadvisor@gmail.com'))
                ->send(new AdminNewUserMail($user));
        } catch (\Exception $e) {
            \Log::error('AdminNewUserMail failed: ' . $e->getMessage());
        }

        return response()->json(['user' => $user, 'token' => $token], 201);
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

        return response()->json(['user' => $user, 'token' => $token]);
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
        return response()->json($request->user());
    }

    // POST /api/auth/reset-password
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Supprime tous les tokens existants pour sécurité
        $user->tokens()->delete();

        // Email de confirmation de modification
        try {
            Mail::to($user->email)->send(new PasswordResetMail($user));
        } catch (\Exception $e) {
            \Log::error('PasswordResetMail failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}
