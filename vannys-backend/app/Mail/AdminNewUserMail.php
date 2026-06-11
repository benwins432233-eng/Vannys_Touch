<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '👤 Nouvel inscrit sur Vanny\'s Touch',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.admin-new-user',
            with: [
                'fullName'     => $this->user->first_name . ' ' . $this->user->last_name,
                'email'        => $this->user->email,
                'phone'        => $this->user->phone ?? 'Non renseigné',
                'registeredAt' => $this->user->created_at->format('d/m/Y à H:i'),
                'dashboardUrl' => config('app.frontend_url') . '/dashboard/users',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
