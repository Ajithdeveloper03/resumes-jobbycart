<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Candidates table
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('full_name')->index();
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable()->index();
            $table->string('alternate_phone')->nullable();
            $table->string('current_location')->nullable()->index();
            $table->string('city')->nullable()->index();
            $table->string('state')->nullable();
            $table->string('country')->nullable()->default('India');
            $table->string('linkedin_url')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('github_url')->nullable();
            $table->string('current_title')->nullable()->index();
            $table->string('primary_role')->nullable()->index();
            $table->decimal('total_experience_years', 4, 1)->default(0)->index();
            $table->decimal('relevant_experience_years', 4, 1)->nullable()->index();
            $table->string('current_company')->nullable()->index();
            $table->string('highest_qualification')->nullable()->index();
            $table->string('degree')->nullable();
            $table->string('specialization')->nullable();
            $table->decimal('current_salary', 12, 2)->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->integer('notice_period_days')->nullable()->index();
            $table->string('notice_period_text')->nullable();
            $table->date('availability_date')->nullable();
            $table->enum('candidate_status', [
                'new', 'screening', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'archived'
            ])->default('new')->index();
            $table->string('source')->default('resume_upload')->index();
            $table->foreignId('assigned_recruiter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('professional_summary')->nullable();
            $table->enum('extraction_status', [
                'pending', 'extracted', 'needs_review', 'verified', 'failed'
            ])->default('extracted')->index();
            $table->boolean('is_verified')->default(false)->index();
            $table->longText('raw_extracted_text')->nullable();
            $table->json('fields_for_review')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Resumes table (file storage metadata)
        Schema::create('resumes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->nullable()->constrained('candidates')->cascadeOnDelete();
            $table->string('original_filename');
            $table->string('stored_filename');
            $table->string('file_path');
            $table->string('file_mime');
            $table->unsignedBigInteger('file_size');
            $table->string('file_hash', 64)->index(); // SHA-256 for duplicate detection
            $table->enum('parsing_status', ['success', 'partial', 'failed'])->default('success');
            $table->text('parsing_error')->nullable();
            $table->longText('text_content')->nullable();
            $table->json('extracted_json')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 3. Candidate Skills
        Schema::create('candidate_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->string('skill_name')->index();
            $table->string('normalized_skill_name')->index();
            $table->string('category')->default('technical'); // technical, soft, framework, database, devops
            $table->decimal('years_of_experience', 4, 1)->nullable();
            $table->enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert'])->nullable();
            $table->timestamps();
        });

        // 4. Candidate Education
        Schema::create('candidate_education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->string('degree');
            $table->string('specialization')->nullable();
            $table->string('institution')->nullable();
            $table->string('graduation_year', 10)->nullable();
            $table->string('grade_or_gpa', 20)->nullable();
            $table->timestamps();
        });

        // 5. Candidate Employment History
        Schema::create('candidate_employment_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->string('company_name');
            $table->string('job_title');
            $table->string('start_date', 20)->nullable();
            $table->string('end_date', 20)->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('responsibilities')->nullable();
            $table->string('location')->nullable();
            $table->timestamps();
        });

        // 6. Candidate Certifications
        Schema::create('candidate_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->string('certification_name');
            $table->string('issuing_organization')->nullable();
            $table->string('issue_year', 10)->nullable();
            $table->timestamps();
        });

        // 7. Candidate Languages
        Schema::create('candidate_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->string('language_name');
            $table->string('proficiency')->nullable();
            $table->timestamps();
        });

        // 8. Job Openings
        Schema::create('job_openings', function (Blueprint $table) {
            $table->id();
            $table->string('title')->index();
            $table->string('department')->nullable()->index();
            $table->string('client_name')->nullable()->index();
            $table->string('location')->nullable()->index();
            $table->decimal('min_experience', 4, 1)->default(0);
            $table->decimal('max_experience', 4, 1)->nullable();
            $table->string('qualification')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'freelance', 'internship'])->default('full_time');
            $table->decimal('min_salary', 12, 2)->nullable();
            $table->decimal('max_salary', 12, 2)->nullable();
            $table->integer('vacancies')->default(1);
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['draft', 'open', 'in_progress', 'closed'])->default('open')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 9. Job Required Skills
        Schema::create('job_required_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_opening_id')->constrained('job_openings')->cascadeOnDelete();
            $table->string('skill_name')->index();
            $table->boolean('is_mandatory')->default(true);
            $table->timestamps();
        });

        // 10. Candidate Applications (linking candidate to job opening)
        Schema::create('candidate_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->foreignId('job_opening_id')->constrained('job_openings')->cascadeOnDelete();
            $table->decimal('match_score', 5, 2)->nullable();
            $table->json('match_details')->nullable();
            $table->enum('status', ['applied', 'screening', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected'])->default('applied')->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 11. Candidate Notes
        Schema::create('candidate_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('note');
            $table->timestamps();
        });

        // 12. Candidate Activity Logs
        Schema::create('candidate_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->nullable()->constrained('candidates')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // 'created', 'updated', 'status_changed', 'resume_uploaded', 'note_added', 'exported'
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // 13. Saved Filters
        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->json('filter_criteria');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saved_filters');
        Schema::dropIfExists('candidate_activity_logs');
        Schema::dropIfExists('candidate_notes');
        Schema::dropIfExists('candidate_applications');
        Schema::dropIfExists('job_required_skills');
        Schema::dropIfExists('job_openings');
        Schema::dropIfExists('candidate_languages');
        Schema::dropIfExists('candidate_certifications');
        Schema::dropIfExists('candidate_employment_history');
        Schema::dropIfExists('candidate_education');
        Schema::dropIfExists('candidate_skills');
        Schema::dropIfExists('resumes');
        Schema::dropIfExists('candidates');
    }
};
