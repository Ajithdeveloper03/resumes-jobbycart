<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateActivityLog;
use App\Models\CandidateNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    /**
     * Store note on candidate.
     */
    public function store(Request $request, int $candidateId): JsonResponse
    {
        $validated = $request->validate([
            'note' => 'required|string|max:2000',
        ]);

        $note = CandidateNote::create([
            'candidate_id' => $candidateId,
            'user_id' => $request->user()->id,
            'note' => $validated['note'],
        ]);

        CandidateActivityLog::log(
            $candidateId,
            $request->user()->id,
            'note_added',
            "Added an internal recruiter note."
        );

        return response()->json([
            'success' => true,
            'message' => 'Note added successfully.',
            'data' => $note->load('user:id,name'),
        ], 201);
    }

    /**
     * Delete note.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $note = CandidateNote::findOrFail($id);

        // Only author or admin can delete
        if ($note->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized to delete this note.'], 403);
        }

        $note->delete();

        return response()->json([
            'success' => true,
            'message' => 'Note deleted successfully.',
        ]);
    }
}
