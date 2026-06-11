<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    // GET /api/products
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'images', 'variants'])
            ->where('is_active', true);

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }
        if ($request->filled('featured')) {
            $query->where('is_featured', true);
        }

        $sort = $request->get('sort', 'created_at');
        $dir  = $request->get('dir', 'desc');
        $query->orderBy(
            in_array($sort, ['price', 'rating', 'created_at']) ? $sort : 'created_at',
            $dir === 'asc' ? 'asc' : 'desc'
        );

        $perPage = min((int) $request->get('per_page', 12), 50);
        return response()->json($query->paginate($perPage));
    }

    // GET /api/products/:slug
    public function show(string $slug): JsonResponse
    {
        $product = Product::with(['category', 'images', 'variants', 'reviews.user'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
        return response()->json($product);
    }

    // POST /api/admin/products
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'category_id'    => 'required|exists:categories,id',
            'badge'          => 'nullable|string|max:50',
            'in_stock'       => 'nullable',
            'is_featured'    => 'nullable',
            'colors'         => 'nullable|array',
            'sizes'          => 'nullable|array',
            'images'         => 'required|array|min:1',
            'images.*'       => 'image|max:5120',
        ]);

        $inStock    = filter_var($request->input('in_stock',   'true'),  FILTER_VALIDATE_BOOLEAN);
        $isFeatured = filter_var($request->input('is_featured', 'false'), FILTER_VALIDATE_BOOLEAN);

        $product = Product::create([
            'name'           => $request->input('name'),
            'description'    => $request->input('description'),
            'price'          => $request->input('price'),
            'original_price' => $request->input('original_price') ?: null,
            'category_id'    => $request->input('category_id'),
            'badge'          => $request->input('badge') ?: null,
            'in_stock'       => $inStock,
            'is_featured'    => $isFeatured,
            'slug'           => Str::slug($request->input('name')) . '-' . Str::random(6),
        ]);

        foreach ($request->file('images') as $i => $file) {
            try {
                $uploaded = $this->cloudinary->upload($file->getRealPath(), [
                    'folder'         => 'vannys-touch/products',
                    'transformation' => [['quality' => 'auto', 'fetch_format' => 'auto']],
                ]);
                ProductImage::create([
                    'product_id'    => $product->id,
                    'cloudinary_id' => $uploaded['public_id'],
                    'url'           => $uploaded['secure_url'],
                    'url_thumbnail' => $this->cloudinary->transform($uploaded['public_id'], 'w_300,h_300,c_fill'),
                    'url_medium'    => $this->cloudinary->transform($uploaded['public_id'], 'w_600,h_600,c_fill'),
                    'is_primary'    => $i === 0,
                    'sort_order'    => $i,
                ]);
            } catch (\Exception $e) {
                \Log::error('Cloudinary upload failed: ' . $e->getMessage());
                // On continue même si une image échoue
            }
        }

        foreach ($request->input('colors', []) as $color) {
            if (trim($color)) {
                ProductVariant::create(['product_id' => $product->id, 'type' => 'color', 'value' => trim($color)]);
            }
        }
        foreach ($request->input('sizes', []) as $size) {
            if (trim($size)) {
                ProductVariant::create(['product_id' => $product->id, 'type' => 'size', 'value' => trim($size)]);
            }
        }

        return response()->json($product->load(['category', 'images', 'variants']), 201);
    }

    // POST /api/admin/products/:id  (avec _method=PUT dans le FormData)
    public function update(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'category_id'    => 'sometimes|exists:categories,id',
            'badge'          => 'nullable|string|max:50',
            'in_stock'       => 'nullable',
            'is_featured'    => 'nullable',
            'colors'         => 'nullable|array',
            'sizes'          => 'nullable|array',
            'images'         => 'nullable|array',
            'images.*'       => 'image|max:5120',
        ]);

        $updateData = [];
        foreach (['name', 'description', 'price', 'original_price', 'category_id', 'badge'] as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field) ?: null;
            }
        }
        if ($request->has('in_stock')) {
            $updateData['in_stock'] = filter_var($request->input('in_stock'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('is_featured')) {
            $updateData['is_featured'] = filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN);
        }

        $product->update($updateData);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $file) {
                try {
                    $uploaded = $this->cloudinary->upload($file->getRealPath(), [
                        'folder' => 'vannys-touch/products',
                    ]);
                    ProductImage::create([
                        'product_id'    => $product->id,
                        'cloudinary_id' => $uploaded['public_id'],
                        'url'           => $uploaded['secure_url'],
                        'url_thumbnail' => $this->cloudinary->transform($uploaded['public_id'], 'w_300,h_300,c_fill'),
                        'url_medium'    => $this->cloudinary->transform($uploaded['public_id'], 'w_600,h_600,c_fill'),
                        'is_primary'    => $product->images()->count() === 0 && $i === 0,
                        'sort_order'    => $product->images()->count() + $i,
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Cloudinary upload failed on update: ' . $e->getMessage());
                }
            }
        }

        if ($request->has('colors') || $request->has('sizes')) {
            $product->variants()->delete();
            foreach ($request->input('colors', []) as $color) {
                if (trim($color)) {
                    ProductVariant::create(['product_id' => $product->id, 'type' => 'color', 'value' => trim($color)]);
                }
            }
            foreach ($request->input('sizes', []) as $size) {
                if (trim($size)) {
                    ProductVariant::create(['product_id' => $product->id, 'type' => 'size', 'value' => trim($size)]);
                }
            }
        }

        return response()->json($product->load(['category', 'images', 'variants']));
    }

    // DELETE /api/admin/products/:id
    public function destroy(Product $product): JsonResponse
    {
        foreach ($product->images as $image) {
            try {
                $this->cloudinary->delete($image->cloudinary_id);
            } catch (\Exception $e) {
                \Log::error('Cloudinary delete failed: ' . $e->getMessage());
                // On continue même si Cloudinary échoue
            }
        }
        $product->delete();
        return response()->json(['message' => 'Produit supprimé.']);
    }
}
