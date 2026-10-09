<?php

namespace App\Support;

use Illuminate\Contracts\Database\Query\Builder;

/**
 * A "contains this text" filter for a search box, across one or more columns.
 *
 * The reason this isn't just `where($column, 'like', "%{$term}%")` at each call site: `%` and `_`
 * are wildcards to LIKE, so passing the box's text through untouched means a learner typing `%`
 * matches every row instead of none, and `_` quietly matches any character. Both have to be
 * escaped, and the escape character has to be named explicitly — MySQL assumes a backslash, SQLite
 * (what the tests run on) has no default at all, so a backslash-escaped pattern behaves differently
 * on each. `!` is used instead and declared in the clause, which both agree on.
 *
 * Case-insensitivity comes from the column's own collation on MySQL and from LIKE's ASCII-folding
 * on SQLite; neither needs a `lower()` wrapper, which would only cost the index.
 */
final class LikeSearch
{
    /**
     * @param  list<string>  $columns  Matched with OR — a row qualifies if any one of them contains the term.
     */
    public static function apply(Builder $query, string $term, array $columns): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';

        $query->where(function (Builder $group) use ($columns, $pattern) {
            foreach ($columns as $column) {
                $group->orWhereRaw($group->getGrammar()->wrap($column)." like ? escape '!'", [$pattern]);
            }
        });
    }
}
