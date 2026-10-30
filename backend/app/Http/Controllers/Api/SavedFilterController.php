<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    /**
     * List user's saved filter presets.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = SavedFilter::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $filters,
        ]);
    }

    /**
     * Store new filter preset.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'filter_criteria' => 'required|array',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            SavedFilter::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $filter = SavedFilter::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'filter_criteria' => $validated['filter_criteria'],
            'is_default' => $validated['is_default'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Filter preset saved successfully.',
            'data' => $filter,
        ], 201);
    }

    /**
     * Delete a saved filter.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $filter = SavedFilter::where('user_id', $request->user()->id)->findOrFail($id);
        $filter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Saved filter removed.',
        ]);
    }
}
