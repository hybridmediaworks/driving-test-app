<?php

namespace App\Policies;

use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function view(?User $user, Quiz $quiz): bool
    {
        return $quiz->is_active;
    }
}
