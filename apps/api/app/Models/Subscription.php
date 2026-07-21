<?php

namespace App\Models;

use Laravel\Cashier\Subscription as CashierSubscription;

/**
 * Extends Cashier's own Subscription model purely to cast `past_due_since` — an app-owned column
 * added on top of Cashier's stock schema (see the additive change in
 * ..._create_subscriptions_table.php) that Cashier's own model has no knowledge of. Registered via
 * Cashier::useSubscriptionModel() in AppServiceProvider so `$user->subscription('default')`
 * transparently returns this subclass instead of the stock one.
 */
class Subscription extends CashierSubscription
{
    protected function casts(): array
    {
        return [
            ...parent::casts(),
            'past_due_since' => 'datetime',
        ];
    }
}
