<?php

namespace App\Actions\CheatSheet;

use App\Models\CheatSheet;

class SyncCheatSheetSections
{
    /**
     * Fully replaces a cheat sheet's sections and clears its cached PDF so the next download
     * regenerates from the new content instead of silently going stale.
     *
     * @param  list<array{heading: string, body_markdown: string}>  $sections
     */
    public function __invoke(CheatSheet $cheatSheet, array $sections): void
    {
        $cheatSheet->sections()->delete();

        foreach ($sections as $index => $row) {
            $cheatSheet->sections()->create([
                'heading' => $row['heading'],
                'body_markdown' => $row['body_markdown'],
                'sort_order' => $index,
            ]);
        }

        $cheatSheet->clearMediaCollection(CheatSheet::MEDIA_COLLECTION_PDF);
    }
}
