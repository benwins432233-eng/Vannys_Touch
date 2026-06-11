<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🛍️ Nouvelle commande #' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.admin-new-order',
            with: [
                'orderNumber'  => $this->order->order_number,
                'customerName' => $this->order->user->first_name . ' ' . $this->order->user->last_name,
                'customerEmail'=> $this->order->user->email,
                'orderItems'   => $this->order->items,
                'total'        => $this->order->total_amount,
                'dashboardUrl' => config('app.frontend_url') . '/dashboard/orders/' . $this->order->id,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
