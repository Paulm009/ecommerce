<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use App\Enums\ProductOrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'shopping_cart_id', 'order_number', 'customer_id', 'buyer_name', 'buyer_email', 'buyer_phone', 'buyer_identity_document', 'status', 'payment_expires_at', 'paid_at', 'delivered_at', 'delivered_by_user_id', 'cancelled_at', 'cancelled_by_user_id', 'cancellation_reason', 'fulfillment_notes'])]
class ProductOrder extends Model
{
    use HasUuidPrimary;

    protected $attributes = ['status' => 'pending_payment'];

    protected function casts(): array
    {
        return ['status' => ProductOrderStatus::class, 'payment_expires_at' => 'datetime', 'paid_at' => 'datetime', 'delivered_at' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProductOrderItem::class);
    }
}
