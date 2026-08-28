<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; font-weight: 600;">
        {{ $question->topic ?? 'Daily practice question' }}
    </p>

    <p style="font-size: 18px; font-weight: 600;">{{ $question->question_text }}</p>

    @if (($question->image_urls[0] ?? null))
        <p><img src="{{ $question->image_urls[0] }}" alt="" style="max-width: 100%; border-radius: 8px;"></p>
    @endif

    <ul style="list-style: none; padding: 0;">
        @foreach ($question->answers as $answer)
            <li style="padding: 10px 14px; margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">
                {{ $answer->answer_text }}
            </li>
        @endforeach
    </ul>

    <p style="color: #6b7280; font-size: 13px;">⌄ Scroll down for the answer ⌄</p>
    <br><br><br>
    <hr style="border: none; border-top: 1px solid #e5e7eb;">

    <p style="font-weight: 600; color: #16a34a;">
        Correct answer: {{ $question->answers->firstWhere('is_correct', true)?->answer_text }}
    </p>
    @if ($question->explanation)
        <p style="color: #374151;">{{ $question->explanation }}</p>
    @endif

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 32px;">
    <p style="font-size: 12px; color: #9ca3af;">
        <a href="{{ $unsubscribeUrl }}" style="color: #9ca3af;">Unsubscribe</a> from daily practice questions.
    </p>
</body>
</html>
