<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1a1a1a;">
    @php($status = $claim->status->value)
    <p>
        @if ($status === 'approved')
            Good news — your Pass Guarantee claim has been approved. Your refund is being processed.
        @elseif ($status === 'refunded')
            Your Pass Guarantee refund has been issued.
        @elseif ($status === 'denied')
            Your Pass Guarantee claim was not approved.
        @else
            There's an update on your Pass Guarantee claim.
        @endif
    </p>
    @if ($claim->admin_notes)
        <p>{{ $claim->admin_notes }}</p>
    @endif
    <p>
        <a href="{{ $claimsUrl }}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
            View claim
        </a>
    </p>
</body>
</html>
