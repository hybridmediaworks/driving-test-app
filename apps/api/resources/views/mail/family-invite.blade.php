<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1a1a1a;">
    <p>You've been invited to join a family plan on {{ config('app.name') }}.</p>
    <p>
        <a href="{{ $claimUrl }}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
            Accept invite
        </a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p>{{ $claimUrl }}</p>
</body>
</html>
