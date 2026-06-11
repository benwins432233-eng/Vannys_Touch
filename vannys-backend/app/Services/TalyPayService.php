<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TalyPayService
{
    private string $apiUrl;
    private string $apiKey;
    private string $env;

    public function __construct()
    {
        $this->apiUrl = env('TALYPAY_API_URL', 'https://talypay-me.com/api/v1');
        $this->apiKey = env('TALYPAY_API_KEY', '');
        $this->env    = env('TALYPAY_ENV', 'production');
    }

    // Modes de paiement supportés
    public static function paymentModes(): array
    {
        return [
            'MTN'   => 'mtn_momo',
            'MOOV'  => 'moov_money',
            'CELTIIS' => 'celtiis_cash',
        ];
    }

    // Initialiser un paiement
    public function initPayment(array $params): array
    {
        $response = Http::withHeaders([
            'Authorization'       => 'Bearer ' . $this->apiKey,
            'Content-Type'        => 'application/json',
            'Request-Environment' => $this->env,
        ])->post($this->apiUrl . '/init-payment', [
            'payment_mode'      => $params['payment_mode'],
            'customer_name'     => $params['last_name'],
            'customer_firstname'=> $params['first_name'],
            'customer_email'    => $params['email'],
            'amount'            => (string) $params['amount'],
            'currency'          => 'XOF',
            'country'           => 'benin',
            'payment_ref'       => $params['payment_ref'],
            'customer_tel'      => $params['phone'],
            'description'       => $params['description'],
            'callback_url'      => env('APP_URL') . '/api/payments/webhook',
            'return_url'        => env('FRONTEND_URL') . '/payment/success?ref=' . $params['payment_ref'],
        ]);

        if (!$response->successful()) {
            \Log::error('TalyPay init failed', [
                'status'   => $response->status(),
                'response' => $response->json(),
            ]);
            throw new \Exception('Erreur lors de l\'initialisation du paiement : ' . ($response->json()['message'] ?? 'Erreur inconnue'));
        }

        return $response->json();
    }

    // Vérifier le statut d'un paiement
    public function checkPayment(string $paymentRef): array
    {
        $response = Http::withHeaders([
            'Authorization'       => 'Bearer ' . $this->apiKey,
            'Request-Environment' => $this->env,
        ])->get($this->apiUrl . '/check-payment/' . $paymentRef);

        if (!$response->successful()) {
            throw new \Exception('Impossible de vérifier le paiement');
        }

        return $response->json();
    }
}
