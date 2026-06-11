<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderConfirmedMail;
use App\Models\Order;
use App\Models\Payment;
use App\Services\TalyPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(private TalyPayService $talyPay) {}

    // POST /api/payments/init
    // Initialise le paiement pour une commande existante
    public function init(Request $request): JsonResponse
    {
        $request->validate([
            'order_id'       => 'required|exists:orders,id',
            'payment_method' => 'required|in:MTN,MOOV,CELTIIS',
            'phone_number'   => 'required|string|max:30',
        ]);

        $order = Order::with(['user', 'items'])->findOrFail($request->order_id);

        // Vérifier que la commande appartient à l'utilisateur connecté
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Vérifier que la commande n'est pas déjà payée
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Cette commande est déjà payée.'], 400);
        }

        // Mapper le mode de paiement
        $modes = TalyPayService::paymentModes();
        $paymentMode = $modes[$request->payment_method] ?? null;

        if (!$paymentMode) {
            return response()->json(['message' => 'Mode de paiement invalide.'], 400);
        }

        // Générer une référence unique
        $paymentRef = 'VT-' . strtoupper(Str::random(8)) . '-' . $order->id;

        try {
            $result = $this->talyPay->initPayment([
                'payment_mode' => $paymentMode,
                'first_name'   => $order->user->first_name,
                'last_name'    => $order->user->last_name,
                'email'        => $order->user->email,
                'phone'        => $request->phone_number,
                'amount'       => $order->total,
                'payment_ref'  => $paymentRef,
                'description'  => 'Commande #' . $order->order_number . ' - Vanny\'s Touch',
            ]);

            // Sauvegarder le paiement en base
            Payment::create([
                'order_id'       => $order->id,
                'payment_ref'    => $paymentRef,
                'talypay_ref'    => $result['transaction_id'] ?? null,
                'amount'         => $order->total,
                'payment_method' => $request->payment_method,
                'payment_mode'   => $paymentMode,
                'status'         => 'pending',
                'phone_number'   => $request->phone_number,
                'talypay_data'   => json_encode($result),
            ]);

            // Mettre à jour la commande
            $order->update([
                'payment_ref'    => $paymentRef,
                'payment_status' => 'pending',
            ]);

            return response()->json([
                'payment_ref'  => $paymentRef,
                'payment_url'  => $result['payment_url'] ?? null,
                'message'      => $result['message'] ?? 'Paiement initié',
                'talypay_data' => $result,
            ]);

        } catch (\Exception $e) {
            \Log::error('Payment init failed: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // GET /api/payments/check/{ref}
    // Vérifier le statut d'un paiement
    public function check(Request $request, string $ref): JsonResponse
    {
        $payment = Payment::where('payment_ref', $ref)->firstOrFail();

        // Vérifier que le paiement appartient à l'utilisateur
        if ($payment->order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        try {
            $result = $this->talyPay->checkPayment($ref);
            $status = $result['status'] ?? 'pending';

            // Si paiement confirmé
            if (in_array($status, ['success', 'completed', 'paid'])) {
                $this->confirmPayment($payment);
            }

            return response()->json([
                'status'      => $payment->fresh()->status,
                'talypay_data' => $result,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST /api/payments/webhook (appelé par TalyPay)
    public function webhook(Request $request): JsonResponse
    {
        \Log::info('TalyPay webhook received', $request->all());

        $paymentRef = $request->input('payment_ref');
        $status     = $request->input('status');

        if (!$paymentRef) {
            return response()->json(['message' => 'Référence manquante'], 400);
        }

        $payment = Payment::where('payment_ref', $paymentRef)->first();

        if (!$payment) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        if (in_array($status, ['success', 'completed', 'paid'])) {
            $this->confirmPayment($payment);
        } elseif ($status === 'failed') {
            $payment->update(['status' => 'failed']);
            $payment->order->update(['payment_status' => 'failed']);
        }

        return response()->json(['message' => 'Webhook traité']);
    }

    // Confirmer un paiement et mettre à jour la commande
    private function confirmPayment(Payment $payment): void
    {
        if ($payment->status === 'paid') return; // déjà confirmé

        $payment->update(['status' => 'paid']);

        $order = $payment->order;
        $order->update([
            'payment_status' => 'paid',
            'status'         => 'processing',
        ]);

        $order->load(['user', 'items']);

        // Email de confirmation au client
        try {
            Mail::to($order->user->email)->send(new OrderConfirmedMail($order));
        } catch (\Exception $e) {
            \Log::error('OrderConfirmedMail failed: ' . $e->getMessage());
        }

        // Notification admin
        try {
            Mail::to(config('mail.admin_address'))->send(new \App\Mail\AdminNewOrderMail($order));
        } catch (\Exception $e) {
            \Log::error('AdminNewOrderMail failed: ' . $e->getMessage());
        }
    }
}
