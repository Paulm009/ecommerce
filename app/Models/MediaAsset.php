<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\HasUuidPrimary;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'disk', 'path', 'original_name', 'mime_type', 'size_bytes', 'checksum_sha256', 'width', 'height', 'uploaded_by_user_id'])]
class MediaAsset extends Model
{
    use HasUuidPrimary, SoftDeletes;

    public const UPDATED_AT = null;
}
