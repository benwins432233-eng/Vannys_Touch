<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbandonedCartMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public array $cartItems
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vous avez oublié quelque chose 🛒',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.abandoned-cart',
            with: [
                'firstName' => $this->user->first_name,
                'cartItems' => $this->cartItems,
                'cartUrl'   => config('app.frontend_url') . '/cart',
                'shopUrl'   => config('app.frontend_url') . '/shop',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
