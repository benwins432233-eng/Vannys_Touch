<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Commande #' . $this->order->order_number . ' confirmée ✅',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-confirmed',
            with: [
                'firstName'   => $this->order->user->first_name,
                'orderNumber' => $this->order->order_number,
                'orderItems'  => $this->order->items,
                'total'       => $this->order->total_amount,
                'orderUrl'    => config('app.frontend_url') . '/orders/' . $this->order->id,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
