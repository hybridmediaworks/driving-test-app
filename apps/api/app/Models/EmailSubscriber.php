<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailSubscriber extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'state',
        'source',
        'unsubscribe_token',
        'vehicle_type',
        'last_sent_at',
        'unsubscribed_at',
    ];

    protected function casts(): array
    {
        return [
            'unsubscribed_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }
}
