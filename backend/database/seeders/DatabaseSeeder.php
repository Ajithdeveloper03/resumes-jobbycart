<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\CandidateCertification;
use App\Models\CandidateEducation;
use App\Models\CandidateEmploymentHistory;
use App\Models\CandidateLanguage;
use App\Models\CandidateNote;
use App\Models\CandidateSkill;
use App\Models\JobOpening;
use App\Models\JobRequiredSkill;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with initial admin, recruiters, jobs, and candidates.
     */
    public function run(): void
    {
        // 1. Create Administrators (both @jobbycart.com and @inymart.com)
        $admin = User::firstOrCreate(
            ['email' => 'admin@jobbycart.com'],
            [
                'name' => 'Admin Jobbycart',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
                'phone' => '+91 98765 43210',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@inymart.com'],
            [
                'name' => 'Admin Inymart',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
                'phone' => '+91 98765 43210',
            ]
        );

        // 2. Create Recruiters
        $recruiter1 = User::firstOrCreate(
            ['email' => 'recruiter@inymart.com'],
            [
                'name' => 'Priya Sharma',
                'password' => Hash::make('password123'),
                'role' => 'recruiter',
                'is_active' => true,
                'phone' => '+91 98765 43211',
            ]
        );

        $recruiter2 = User::firstOrCreate(
            ['email' => 'karthik.hr@inymart.com'],
            [
                'name' => 'Karthik Raja',
                'password' => Hash::make('password123'),
                'role' => 'recruiter',
                'is_active' => true,
                'phone' => '+91 98765 43212',
            ]
        );

        // Ensure storage/app/resumes directory exists
        Storage::disk('local')->makeDirectory('resumes');

        // Skip seeding sample jobs & candidates if database already has records
        if (Candidate::count() > 0 || JobOpening::count() > 0) {
            return;
        }

        // 3. Create Sample Job Openings
        $job1 = JobOpening::create([
            'title' => 'Senior Laravel & MySQL Developer',
            'department' => 'Engineering',
            'client_name' => 'NexGen Tech Solutions',
            'location' => 'Chennai',
            'min_experience' => 3.0,
            'max_experience' => 6.0,
            'qualification' => 'B.E. / B.Tech Computer Science',
            'employment_type' => 'full_time',
            'min_salary' => 600000,
            'max_salary' => 1100000,
            'vacancies' => 3,
            'description' => 'Looking for an experienced Laravel Backend Developer proficient in MySQL query optimization, REST APIs, Redis, and clean MVC architecture.',
            'priority' => 'high',
            'status' => 'open',
            'created_by' => $admin->id,
        ]);
        foreach (['Laravel', 'PHP', 'MySQL', 'REST API', 'Redis'] as $skill) {
            JobRequiredSkill::create(['job_opening_id' => $job1->id, 'skill_name' => $skill, 'is_mandatory' => true]);
        }

        $job2 = JobOpening::create([
            'title' => 'Frontend React Engineer',
            'department' => 'UI Development',
            'client_name' => 'Apex Digital Ventures',
            'location' => 'Coimbatore',
            'min_experience' => 2.0,
            'max_experience' => 5.0,
            'qualification' => 'B.Sc / BCA / B.E.',
            'employment_type' => 'full_time',
            'min_salary' => 450000,
            'max_salary' => 850000,
            'vacancies' => 2,
            'description' => 'Seeking a skilled React Developer with deep knowledge of React 18+, TypeScript, Tailwind CSS, and state management.',
            'priority' => 'medium',
            'status' => 'open',
            'created_by' => $recruiter1->id,
        ]);
        foreach (['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3'] as $skill) {
            JobRequiredSkill::create(['job_opening_id' => $job2->id, 'skill_name' => $skill, 'is_mandatory' => true]);
        }

        $job3 = JobOpening::create([
            'title' => 'Full Stack PHP / React Architect',
            'department' => 'Product Engineering',
            'client_name' => 'CloudScale Systems',
            'location' => 'Bangalore',
            'min_experience' => 4.0,
            'max_experience' => 8.0,
            'qualification' => 'B.Tech / M.Tech / MCA',
            'employment_type' => 'full_time',
            'min_salary' => 900000,
            'max_salary' => 1600000,
            'vacancies' => 2,
            'description' => 'Senior Full Stack role building SaaS solutions with modern Laravel APIs, React frontend, Docker containerization, and AWS deployment.',
            'priority' => 'urgent',
            'status' => 'open',
            'created_by' => $admin->id,
        ]);
        foreach (['Laravel', 'React', 'MySQL', 'Docker', 'AWS'] as $skill) {
            JobRequiredSkill::create(['job_opening_id' => $job3->id, 'skill_name' => $skill, 'is_mandatory' => true]);
        }

        // 4. Create Realistic Sample Candidates
        $candidatesData = [
            [
                'full_name' => 'Ajith Kumar S',
                'first_name' => 'Ajith Kumar',
                'last_name' => 'S',
                'email' => 'ajith.kumar.dev@example.com',
                'phone' => '+91 98401 23456',
                'current_location' => 'Chennai, Tamil Nadu',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'linkedin_url' => 'https://linkedin.com/in/ajithkumar-dev',
                'github_url' => 'https://github.com/ajith-kumar',
                'current_title' => 'Senior Laravel Developer',
                'primary_role' => 'Laravel Developer',
                'total_experience_years' => 4.5,
                'relevant_experience_years' => 4.5,
                'current_company' => 'Cognitive Cloud Infotech',
                'highest_qualification' => 'B.Tech',
                'degree' => 'B.Tech Information Technology',
                'current_salary' => 750000,
                'expected_salary' => 1050000,
                'notice_period_days' => 30,
                'notice_period_text' => '30 Days',
                'candidate_status' => 'shortlisted',
                'assigned_recruiter_id' => $recruiter1->id,
                'professional_summary' => 'Dedicated backend engineer with 4.5 years of hands-on experience designing robust microservices, REST APIs, and database architectures using Laravel and MySQL.',
                'skills' => ['Laravel', 'PHP', 'MySQL', 'REST API', 'Redis', 'Git', 'Docker'],
                'education' => [
                    ['degree' => 'B.Tech', 'specialization' => 'Information Technology', 'institution' => 'Anna University', 'graduation_year' => '2020']
                ],
                'history' => [
                    ['company_name' => 'Cognitive Cloud Infotech', 'job_title' => 'Senior Laravel Developer', 'start_date' => '2022', 'end_date' => 'Present', 'is_current' => true],
                    ['company_name' => 'Zeta Softwares', 'job_title' => 'PHP Developer', 'start_date' => '2020', 'end_date' => '2022', 'is_current' => false]
                ],
            ],
            [
                'full_name' => 'Deepika Venkat',
                'first_name' => 'Deepika',
                'last_name' => 'Venkat',
                'email' => 'deepika.venkat@example.com',
                'phone' => '+91 94432 11223',
                'current_location' => 'Coimbatore, Tamil Nadu',
                'city' => 'Coimbatore',
                'state' => 'Tamil Nadu',
                'linkedin_url' => 'https://linkedin.com/in/deepika-react',
                'github_url' => 'https://github.com/deepika-v',
                'current_title' => 'Frontend React Engineer',
                'primary_role' => 'React Developer',
                'total_experience_years' => 3.2,
                'relevant_experience_years' => 3.2,
                'current_company' => 'PixelCraft Solutions',
                'highest_qualification' => 'B.E.',
                'degree' => 'B.E. Computer Science',
                'current_salary' => 550000,
                'expected_salary' => 800000,
                'notice_period_days' => 15,
                'notice_period_text' => '15 Days',
                'candidate_status' => 'screening',
                'assigned_recruiter_id' => $recruiter1->id,
                'professional_summary' => 'Frontend specialist adept at building high-performance modern Single Page Applications using React 18, TypeScript, Tailwind CSS, and Redux Toolkit.',
                'skills' => ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
                'education' => [
                    ['degree' => 'B.E.', 'specialization' => 'Computer Science & Engineering', 'institution' => 'PSG College of Technology', 'graduation_year' => '2021']
                ],
                'history' => [
                    ['company_name' => 'PixelCraft Solutions', 'job_title' => 'React Developer', 'start_date' => '2021', 'end_date' => 'Present', 'is_current' => true]
                ],
            ],
            [
                'full_name' => 'Suresh Ramanathan',
                'first_name' => 'Suresh',
                'last_name' => 'Ramanathan',
                'email' => 'suresh.ramanathan@example.com',
                'phone' => '+91 98840 99887',
                'current_location' => 'Chennai, Tamil Nadu',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'linkedin_url' => 'https://linkedin.com/in/suresh-fullstack',
                'github_url' => 'https://github.com/suresh-r',
                'current_title' => 'Full Stack Architect',
                'primary_role' => 'Full Stack Developer',
                'total_experience_years' => 6.0,
                'relevant_experience_years' => 6.0,
                'current_company' => 'InnoSys Technologies Pvt Ltd',
                'highest_qualification' => 'MCA',
                'degree' => 'MCA Master of Computer Applications',
                'current_salary' => 1100000,
                'expected_salary' => 1500000,
                'notice_period_days' => 0,
                'notice_period_text' => 'Immediate (0 days)',
                'candidate_status' => 'interviewing',
                'assigned_recruiter_id' => $admin->id,
                'professional_summary' => '6 years seasoned Full Stack architect building scalable SaaS architectures using Laravel, React, MySQL, AWS, and Docker.',
                'skills' => ['Laravel', 'PHP', 'React', 'MySQL', 'Docker', 'AWS', 'REST API', 'Linux'],
                'education' => [
                    ['degree' => 'MCA', 'specialization' => 'Computer Applications', 'institution' => 'Loyola College Chennai', 'graduation_year' => '2018']
                ],
                'history' => [
                    ['company_name' => 'InnoSys Technologies Pvt Ltd', 'job_title' => 'Full Stack Lead', 'start_date' => '2021', 'end_date' => 'Present', 'is_current' => true],
                    ['company_name' => 'WebSpire Systems', 'job_title' => 'Senior Software Engineer', 'start_date' => '2018', 'end_date' => '2021', 'is_current' => false]
                ],
            ],
            [
                'full_name' => 'Ananya Deshmukh',
                'first_name' => 'Ananya',
                'last_name' => 'Deshmukh',
                'email' => 'ananya.deshmukh@example.com',
                'phone' => '+91 97654 32190',
                'current_location' => 'Pune, Maharashtra',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'linkedin_url' => 'https://linkedin.com/in/ananya-cloud',
                'github_url' => 'https://github.com/ananya-devops',
                'current_title' => 'DevOps & Cloud Engineer',
                'primary_role' => 'DevOps Engineer',
                'total_experience_years' => 5.2,
                'relevant_experience_years' => 5.2,
                'current_company' => 'CloudFrontier Networks',
                'highest_qualification' => 'B.E.',
                'degree' => 'B.E. Information Technology',
                'current_salary' => 1000000,
                'expected_salary' => 1400000,
                'notice_period_days' => 45,
                'notice_period_text' => '45 Days',
                'candidate_status' => 'new',
                'assigned_recruiter_id' => $recruiter2->id,
                'professional_summary' => 'DevOps practitioner certified in AWS with deep expertise in CI/CD pipeline automation, Kubernetes clusters, Docker containerization, and Terraform.',
                'skills' => ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform', 'Python'],
                'education' => [
                    ['degree' => 'B.E.', 'specialization' => 'Information Technology', 'institution' => 'Pune Institute of Computer Technology', 'graduation_year' => '2019']
                ],
                'history' => [
                    ['company_name' => 'CloudFrontier Networks', 'job_title' => 'Senior DevOps Engineer', 'start_date' => '2022', 'end_date' => 'Present', 'is_current' => true],
                    ['company_name' => 'Syntel India', 'job_title' => 'Systems Engineer', 'start_date' => '2019', 'end_date' => '2022', 'is_current' => false]
                ],
            ],
            [
                'full_name' => 'Vignesh Balakrishnan',
                'first_name' => 'Vignesh',
                'last_name' => 'Balakrishnan',
                'email' => 'vignesh.bala@example.com',
                'phone' => '+91 98941 77665',
                'current_location' => 'Coimbatore, Tamil Nadu',
                'city' => 'Coimbatore',
                'state' => 'Tamil Nadu',
                'linkedin_url' => 'https://linkedin.com/in/vignesh-bala',
                'github_url' => 'https://github.com/vignesh-b',
                'current_title' => 'Junior Web Developer',
                'primary_role' => 'PHP Developer',
                'total_experience_years' => 1.5,
                'relevant_experience_years' => 1.5,
                'current_company' => 'WebCrafters Infotech',
                'highest_qualification' => 'B.Sc',
                'degree' => 'B.Sc Computer Science',
                'current_salary' => 300000,
                'expected_salary' => 450000,
                'notice_period_days' => 15,
                'notice_period_text' => '15 Days',
                'candidate_status' => 'screening',
                'assigned_recruiter_id' => $recruiter1->id,
                'professional_summary' => 'Fast-learning Junior Developer with solid grounding in PHP, MySQL, JavaScript, HTML5, CSS3 and Git.',
                'skills' => ['PHP', 'MySQL', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'Bootstrap'],
                'education' => [
                    ['degree' => 'B.Sc', 'specialization' => 'Computer Science', 'institution' => 'Bharathiar University', 'graduation_year' => '2023']
                ],
                'history' => [
                    ['company_name' => 'WebCrafters Infotech', 'job_title' => 'Junior Web Developer', 'start_date' => '2023', 'end_date' => 'Present', 'is_current' => true]
                ],
            ],
        ];

        foreach ($candidatesData as $data) {
            $skills = $data['skills'];
            $education = $data['education'];
            $history = $data['history'];
            unset($data['skills'], $data['education'], $data['history']);

            $data['source'] = 'manual_review';
            $data['is_verified'] = true;
            $data['extraction_status'] = 'verified';
            $data['created_by'] = $admin->id;

            $candidate = Candidate::create($data);

            // Create sample resume file in storage
            $resumeContent = "Resume of {$candidate->full_name}\nEmail: {$candidate->email}\nPhone: {$candidate->phone}\nSkills: " . implode(', ', $skills) . "\nExperience: {$candidate->total_experience_years} years\nSummary: {$candidate->professional_summary}";
            $filename = 'sample_resume_' . $candidate->id . '.txt';
            Storage::disk('local')->put('resumes/' . $filename, $resumeContent);

            $candidate->update(['raw_extracted_text' => $resumeContent]);

            Resume::create([
                'candidate_id' => $candidate->id,
                'original_filename' => str_replace(' ', '_', $candidate->full_name) . '_Resume.pdf',
                'stored_filename' => $filename,
                'file_path' => 'resumes/' . $filename,
                'file_mime' => 'application/pdf',
                'file_size' => strlen($resumeContent),
                'file_hash' => hash('sha256', $resumeContent),
                'parsing_status' => 'success',
                'text_content' => $resumeContent,
                'uploaded_by' => $admin->id,
            ]);

            foreach ($skills as $skill) {
                CandidateSkill::create([
                    'candidate_id' => $candidate->id,
                    'skill_name' => $skill,
                    'normalized_skill_name' => strtolower($skill),
                    'category' => 'technical',
                    'proficiency' => 'advanced',
                ]);
            }

            foreach ($education as $edu) {
                CandidateEducation::create([
                    'candidate_id' => $candidate->id,
                    'degree' => $edu['degree'],
                    'specialization' => $edu['specialization'],
                    'institution' => $edu['institution'],
                    'graduation_year' => $edu['graduation_year'],
                ]);
            }

            foreach ($history as $emp) {
                CandidateEmploymentHistory::create([
                    'candidate_id' => $candidate->id,
                    'company_name' => $emp['company_name'],
                    'job_title' => $emp['job_title'],
                    'start_date' => $emp['start_date'],
                    'end_date' => $emp['end_date'],
                    'is_current' => $emp['is_current'],
                ]);
            }

            CandidateLanguage::create([
                'candidate_id' => $candidate->id,
                'language_name' => 'English',
                'proficiency' => 'Fluent',
            ]);

            CandidateNote::create([
                'candidate_id' => $candidate->id,
                'user_id' => $admin->id,
                'note' => 'Candidate verified by recruiter. Strong profile for upcoming requirements.',
            ]);
        }
    }
}
