<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class RecruiterController extends Controller
{
    /**
     * List all recruiters and admin users.
     */
    public function index(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_active', 'phone', 'created_at')
            ->withCount('assignedCandidates')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Create a new recruiter account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,recruiter',
            'phone' => 'nullable|string|max:30',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        CandidateActivityLog::log(
            null,
            $request->user()?->id,
            'user_created',
            "New {$validated['role']} user '{$user->name}' was created."
        );

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'phone']),
        ], 201);
    }

    /**
     * Toggle active/inactive status of a user.
     */
    public function toggleActive(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $action = $user->is_active ? 'activated' : 'deactivated';
        CandidateActivityLog::log(
            null,
            $request->user()->id,
            "user_{$action}",
            "User {$user->name} was {$action}."
        );

        return response()->json([
            'success' => true,
            'message' => "User {$user->name} {$action} successfully.",
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active']),
        ]);
    }

    /**
     * Assign candidates to a recruiter.
     */
    public function assignCandidates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recruiter_id' => 'required|exists:users,id',
            'candidate_ids' => 'required|array|min:1',
            'candidate_ids.*' => 'exists:candidates,id',
        ]);

        $recruiter = User::findOrFail($validated['recruiter_id']);

        Candidate::whereIn('id', $validated['candidate_ids'])
            ->update(['assigned_recruiter_id' => $recruiter->id]);

        CandidateActivityLog::log(
            null,
            $request->user()?->id,
            'candidates_assigned',
            "Assigned " . count($validated['candidate_ids']) . " candidates to recruiter {$recruiter->name}."
        );

        return response()->json([
            'success' => true,
            'message' => "Candidates assigned to {$recruiter->name} successfully.",
        ]);
    }
}
