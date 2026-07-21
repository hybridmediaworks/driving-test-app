<?php

namespace App\Enums;

/**
 * Every gated capability, present or future. Cases for content types that don't exist yet
 * (CheatSheets, Flashcards, AiTutor are already built; ExamSimulator has no dedicated content
 * model — it's a Quiz with quiz_type=final, gated via PremiumQuiz same as any other premium quiz)
 * are defined now so wiring a new gate later is a one-line check against an existing case, not a
 * redesign of this enum.
 */
enum Feature: string
{
    case PremiumQuiz = 'premium_quiz';
    case ExamSimulator = 'exam_simulator';
    case CheatSheets = 'cheat_sheets';
    case Flashcards = 'flashcards';
    case AiTutor = 'ai_tutor';
    case AdFree = 'ad_free';
    case PrioritySupport = 'priority_support';
    case PassGuarantee = 'pass_guarantee';
}
