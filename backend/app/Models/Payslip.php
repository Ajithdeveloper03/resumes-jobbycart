<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    protected $fillable = [
        'employee_name', 'employee_id', 'designation', 'department', 'company_name',
        'company_address', 'pay_period', 'payment_date', 'days_worked', 'days_in_period',
        'earnings', 'deductions', 'currency', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'pay_period' => 'date:Y-m-d',
            'payment_date' => 'date:Y-m-d',
            'days_worked' => 'float',
            'days_in_period' => 'float',
            'earnings' => 'array',
            'deductions' => 'array',
        ];
    }
}
