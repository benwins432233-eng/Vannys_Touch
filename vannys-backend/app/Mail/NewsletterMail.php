<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $subject,
        public string $title,
        public string $body,
        public string $ctaText = 'Découvrir',
        public string $ctaUrl = ''
    ) {
        if (empty($this->ctaUrl)) {
            $this->ctaUrl = config('app.frontend_url') . '/shop';
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.newsletter',
            with: [
                'title'   => $this->title,
                'body'    => $this->body,
                'ctaText' => $this->ctaText,
                'ctaUrl'  => $this->ctaUrl,
                'shopUrl' => config('app.frontend_url') . '/shop',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
