<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->string('employee_name');
            $table->string('employee_id')->nullable();
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->string('company_name')->default('Jobbycart');
            $table->string('company_address')->nullable();
            $table->date('pay_period');
            $table->date('payment_date')->nullable();
            $table->decimal('days_worked', 5, 2)->default(0);
            $table->decimal('days_in_period', 5, 2)->default(30);
            $table->json('earnings')->nullable();
            $table->json('deductions')->nullable();
            $table->string('currency', 3)->default('INR');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['employee_id', 'pay_period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
