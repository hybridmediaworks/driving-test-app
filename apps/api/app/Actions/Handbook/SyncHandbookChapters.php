<?php

namespace App\Actions\Handbook;

use App\Models\Handbook;

class SyncHandbookChapters
{
    /**
     * Fully replaces a handbook's chapters and sections — same "delete and recreate" shape as
     * SyncCheatSheetSections, just one level deeper.
     *
     * @param  list<array{title: string, sections: list<array{heading: ?string, content: string}>}>  $chapters
     */
    public function __invoke(Handbook $handbook, array $chapters): void
    {
        $handbook->chapters()->delete();

        foreach ($chapters as $chapterIndex => $chapterRow) {
            $chapter = $handbook->chapters()->create([
                'title' => $chapterRow['title'],
                'sort_order' => $chapterIndex,
            ]);

            foreach ($chapterRow['sections'] as $sectionIndex => $sectionRow) {
                $chapter->sections()->create([
                    'heading' => $sectionRow['heading'] ?? null,
                    'content' => $sectionRow['content'],
                    'sort_order' => $sectionIndex,
                ]);
            }
        }
    }
}
