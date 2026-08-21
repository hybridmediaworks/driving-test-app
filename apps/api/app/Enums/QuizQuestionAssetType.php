<?php

namespace App\Enums;

enum QuizQuestionAssetType: string
{
    case Video = 'video';
    case Audio = 'audio';
    case Lottie = 'lottie';
}
