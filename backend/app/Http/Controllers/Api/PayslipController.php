<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payslip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayslipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payslip::query()->orderByDesc('pay_period')->orderByDesc('id');
        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(fn ($q) => $q->where('employee_name', 'like', "%{$search}%")
                ->orWhere('employee_id', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%"));
        }
        if ($period = $request->query('period')) {
            $query->whereYear('pay_period', substr($period, 0, 4))->whereMonth('pay_period', substr($period, 5, 2));
        }
        return response()->json(['success' => true, 'data' => $query->paginate(15)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);
        $validated['created_by'] = $request->user()->id;
        $payslip = Payslip::create($validated);
        return response()->json(['success' => true, 'data' => $payslip], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Payslip::findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payslip = Payslip::findOrFail($id);
        $payslip->update($this->validated($request));
        return response()->json(['success' => true, 'data' => $payslip->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        Payslip::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'employee_name' => 'required|string|max:255',
            'employee_id' => 'nullable|string|max:100',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string|max:1000',
            'pay_period' => 'required|date_format:Y-m-d',
            'payment_date' => 'nullable|date',
            'days_worked' => 'required|numeric|min:0|max:366',
            'days_in_period' => 'required|numeric|min:1|max:366',
            'earnings' => 'required|array|min:1',
            'earnings.*.name' => 'required|string|max:100',
            'earnings.*.amount' => 'required|numeric|min:0|max:999999999',
            'deductions' => 'present|array',
            'deductions.*.name' => 'required|string|max:100',
            'deductions.*.amount' => 'required|numeric|min:0|max:999999999',
            'currency' => 'required|string|in:INR,USD,EUR,GBP',
            'notes' => 'nullable|string|max:2000',
        ]);
    }
}
