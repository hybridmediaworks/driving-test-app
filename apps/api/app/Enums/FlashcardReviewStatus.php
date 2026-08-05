<?php

namespace App\Enums;

enum FlashcardReviewStatus: string
{
    case New = 'new';
    case Known = 'known';
    case Unknown = 'unknown';
}
