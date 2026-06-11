<?php

namespace App\Services;

use Cloudinary\Cloudinary;

class CloudinaryService
{
    private Cloudinary $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME', 'dggmjflpm'),
                'api_key'    => env('CLOUDINARY_API_KEY',    '347484171624724'),
                'api_secret' => env('CLOUDINARY_API_SECRET', 'EgNi25n0_G84hchrfKbP12JdFrM'),
            ],
            'url'  => ['secure' => true],
        ]);
    }

    public function upload(string $filePath, array $options = []): array
    {
        return (array) $this->cloudinary->uploadApi()->upload($filePath, $options);
    }

    public function transform(string $publicId, string $transformation): string
    {
        return $this->cloudinary->image($publicId)
            ->addTransformation($transformation)
            ->toUrl();
    }

    public function delete(string $publicId): void
    {
        $this->cloudinary->uploadApi()->destroy($publicId);
    }
}
