<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShippedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre commande #' . $this->order->order_number . ' est en route 🚚',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.order-shipped',
            with: [
                'firstName'      => $this->order->user->first_name,
                'orderNumber'    => $this->order->order_number,
                'trackingNumber' => $this->order->tracking_number ?? null,
                'orderUrl'       => config('app.frontend_url') . '/orders/' . $this->order->id,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
