<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class ResumeParserService
{
    /**
     * Common skills database with categorization.
     */
    protected array $skillsDatabase = [
        'PHP' => ['category' => 'technical', 'role' => 'Backend Developer'],
        'Laravel' => ['category' => 'framework', 'role' => 'Laravel Developer'],
        'Symfony' => ['category' => 'framework', 'role' => 'PHP Developer'],
        'CodeIgniter' => ['category' => 'framework', 'role' => 'PHP Developer'],
        'React' => ['category' => 'framework', 'role' => 'React Developer'],
        'React.js' => ['category' => 'framework', 'role' => 'React Developer'],
        'React Native' => ['category' => 'framework', 'role' => 'Mobile App Developer'],
        'Vue' => ['category' => 'framework', 'role' => 'Frontend Developer'],
        'Vue.js' => ['category' => 'framework', 'role' => 'Frontend Developer'],
        'Angular' => ['category' => 'framework', 'role' => 'Frontend Developer'],
        'Next.js' => ['category' => 'framework', 'role' => 'Full Stack Developer'],
        'Node.js' => ['category' => 'technical', 'role' => 'Node.js Developer'],
        'Express.js' => ['category' => 'framework', 'role' => 'Backend Developer'],
        'JavaScript' => ['category' => 'technical', 'role' => 'Frontend Developer'],
        'TypeScript' => ['category' => 'technical', 'role' => 'Full Stack Developer'],
        'Python' => ['category' => 'technical', 'role' => 'Python Developer'],
        'Django' => ['category' => 'framework', 'role' => 'Python Developer'],
        'Flask' => ['category' => 'framework', 'role' => 'Python Developer'],
        'FastAPI' => ['category' => 'framework', 'role' => 'Python Developer'],
        'Java' => ['category' => 'technical', 'role' => 'Java Developer'],
        'Spring Boot' => ['category' => 'framework', 'role' => 'Java Developer'],
        'C#' => ['category' => 'technical', 'role' => '.NET Developer'],
        '.NET' => ['category' => 'framework', 'role' => '.NET Developer'],
        'ASP.NET' => ['category' => 'framework', 'role' => '.NET Developer'],
        'C++' => ['category' => 'technical', 'role' => 'Software Engineer'],
        'Golang' => ['category' => 'technical', 'role' => 'Go Developer'],
        'Go' => ['category' => 'technical', 'role' => 'Go Developer'],
        'Ruby' => ['category' => 'technical', 'role' => 'Ruby Developer'],
        'Ruby on Rails' => ['category' => 'framework', 'role' => 'Ruby on Rails Developer'],
        'MySQL' => ['category' => 'database', 'role' => 'Database Administrator'],
        'PostgreSQL' => ['category' => 'database', 'role' => 'Database Administrator'],
        'MongoDB' => ['category' => 'database', 'role' => 'Full Stack Developer'],
        'Redis' => ['category' => 'database', 'role' => 'Backend Developer'],
        'SQLite' => ['category' => 'database', 'role' => 'Software Engineer'],
        'Oracle' => ['category' => 'database', 'role' => 'Oracle Database Administrator'],
        'SQL Server' => ['category' => 'database', 'role' => 'Database Administrator'],
        'HTML5' => ['category' => 'technical', 'role' => 'Web Developer'],
        'CSS3' => ['category' => 'technical', 'role' => 'Web Developer'],
        'Tailwind CSS' => ['category' => 'framework', 'role' => 'Frontend Developer'],
        'Bootstrap' => ['category' => 'framework', 'role' => 'Web Developer'],
        'Sass' => ['category' => 'technical', 'role' => 'Frontend Developer'],
        'REST API' => ['category' => 'technical', 'role' => 'Backend Developer'],
        'RESTful APIs' => ['category' => 'technical', 'role' => 'Backend Developer'],
        'GraphQL' => ['category' => 'technical', 'role' => 'Full Stack Developer'],
        'Docker' => ['category' => 'devops', 'role' => 'DevOps Engineer'],
        'Kubernetes' => ['category' => 'devops', 'role' => 'DevOps Engineer'],
        'AWS' => ['category' => 'cloud', 'role' => 'Cloud Engineer'],
        'Amazon Web Services' => ['category' => 'cloud', 'role' => 'Cloud Engineer'],
        'Azure' => ['category' => 'cloud', 'role' => 'Cloud Engineer'],
        'GCP' => ['category' => 'cloud', 'role' => 'Cloud Engineer'],
        'Google Cloud' => ['category' => 'cloud', 'role' => 'Cloud Engineer'],
        'CI/CD' => ['category' => 'devops', 'role' => 'DevOps Engineer'],
        'Jenkins' => ['category' => 'devops', 'role' => 'DevOps Engineer'],
        'Git' => ['category' => 'tool', 'role' => 'Software Engineer'],
        'GitHub' => ['category' => 'tool', 'role' => 'Software Engineer'],
        'GitLab' => ['category' => 'tool', 'role' => 'Software Engineer'],
        'Linux' => ['category' => 'system', 'role' => 'System Administrator'],
        'Nginx' => ['category' => 'system', 'role' => 'DevOps Engineer'],
        'Apache' => ['category' => 'system', 'role' => 'System Administrator'],
        'Jira' => ['category' => 'tool', 'role' => 'Project Manager'],
        'Agile' => ['category' => 'process', 'role' => 'Scrum Master'],
        'Scrum' => ['category' => 'process', 'role' => 'Scrum Master'],
        'UI/UX' => ['category' => 'design', 'role' => 'UI/UX Designer'],
        'Figma' => ['category' => 'design', 'role' => 'UI/UX Designer'],
        'Adobe XD' => ['category' => 'design', 'role' => 'UI/UX Designer'],
        'Photoshop' => ['category' => 'design', 'role' => 'Graphic Designer'],
        'Illustrator' => ['category' => 'design', 'role' => 'Graphic Designer'],
        'WordPress' => ['category' => 'cms', 'role' => 'WordPress Developer'],
        'Shopify' => ['category' => 'cms', 'role' => 'Shopify Developer'],
        'Magento' => ['category' => 'cms', 'role' => 'Magento Developer'],
        'Flutter' => ['category' => 'framework', 'role' => 'Flutter Developer'],
        'Swift' => ['category' => 'technical', 'role' => 'iOS Developer'],
        'Kotlin' => ['category' => 'technical', 'role' => 'Android Developer'],
        'Android' => ['category' => 'technical', 'role' => 'Android Developer'],
        'iOS' => ['category' => 'technical', 'role' => 'iOS Developer'],
        'Machine Learning' => ['category' => 'technical', 'role' => 'ML Engineer'],
        'Deep Learning' => ['category' => 'technical', 'role' => 'AI Engineer'],
        'TensorFlow' => ['category' => 'framework', 'role' => 'ML Engineer'],
        'PyTorch' => ['category' => 'framework', 'role' => 'ML Engineer'],
        'Pandas' => ['category' => 'technical', 'role' => 'Data Analyst'],
        'NumPy' => ['category' => 'technical', 'role' => 'Data Scientist'],
        'Power BI' => ['category' => 'tool', 'role' => 'BI Analyst'],
        'Tableau' => ['category' => 'tool', 'role' => 'Data Analyst'],
        'Excel' => ['category' => 'tool', 'role' => 'Operations Analyst'],
        'QA' => ['category' => 'testing', 'role' => 'QA Engineer'],
        'Selenium' => ['category' => 'testing', 'role' => 'Automation Tester'],
        'Manual Testing' => ['category' => 'testing', 'role' => 'QA Tester'],
        'Postman' => ['category' => 'tool', 'role' => 'Software Engineer'],
        'Cybersecurity' => ['category' => 'security', 'role' => 'Security Analyst'],
        'Leadership' => ['category' => 'soft', 'role' => 'Team Lead'],
        'Communication' => ['category' => 'soft', 'role' => 'HR Recruiter'],
        'Problem Solving' => ['category' => 'soft', 'role' => 'Software Engineer'],
        'Team Management' => ['category' => 'soft', 'role' => 'Engineering Manager'],
    ];

    /**
     * City and state knowledge base covering Indian hubs and major global tech centers.
     */
    protected array $citiesDatabase = [
        // Tamil Nadu
        'Chennai' => 'Tamil Nadu',
        'Coimbatore' => 'Tamil Nadu',
        'Madurai' => 'Tamil Nadu',
        'Trichy' => 'Tamil Nadu',
        'Tiruchirappalli' => 'Tamil Nadu',
        'Salem' => 'Tamil Nadu',
        'Tirupur' => 'Tamil Nadu',
        'Erode' => 'Tamil Nadu',
        'Tirunelveli' => 'Tamil Nadu',
        'Vellore' => 'Tamil Nadu',
        'Thanjavur' => 'Tamil Nadu',
        'Dindigul' => 'Tamil Nadu',
        'Hosur' => 'Tamil Nadu',
        'Nagercoil' => 'Tamil Nadu',
        'Kanchipuram' => 'Tamil Nadu',
        'Thoothukudi' => 'Tamil Nadu',
        'Tuticorin' => 'Tamil Nadu',
        'Cuddalore' => 'Tamil Nadu',
        'Karur' => 'Tamil Nadu',
        'Kumbakonam' => 'Tamil Nadu',
        'Pudukkottai' => 'Tamil Nadu',
        'Namakkal' => 'Tamil Nadu',
        'Sivakasi' => 'Tamil Nadu',
        // Karnataka
        'Bangalore' => 'Karnataka',
        'Bengaluru' => 'Karnataka',
        'Mysore' => 'Karnataka',
        'Mysuru' => 'Karnataka',
        'Mangalore' => 'Karnataka',
        'Mangaluru' => 'Karnataka',
        'Hubli' => 'Karnataka',
        'Hubballi' => 'Karnataka',
        'Belgaum' => 'Karnataka',
        'Belagavi' => 'Karnataka',
        'Dharwad' => 'Karnataka',
        'Gulbarga' => 'Karnataka',
        'Kalaburagi' => 'Karnataka',
        'Davanagere' => 'Karnataka',
        'Shimoga' => 'Karnataka',
        'Shivamogga' => 'Karnataka',
        'Tumkur' => 'Karnataka',
        'Udupi' => 'Karnataka',
        'Bellary' => 'Karnataka',
        // Telangana & Andhra Pradesh
        'Hyderabad' => 'Telangana',
        'Secunderabad' => 'Telangana',
        'Warangal' => 'Telangana',
        'Nizamabad' => 'Telangana',
        'Karimnagar' => 'Telangana',
        'Visakhapatnam' => 'Andhra Pradesh',
        'Vizag' => 'Andhra Pradesh',
        'Vijayawada' => 'Andhra Pradesh',
        'Guntur' => 'Andhra Pradesh',
        'Nellore' => 'Andhra Pradesh',
        'Tirupati' => 'Andhra Pradesh',
        'Kakinada' => 'Andhra Pradesh',
        'Rajahmundry' => 'Andhra Pradesh',
        'Kurnool' => 'Andhra Pradesh',
        'Kadapa' => 'Andhra Pradesh',
        'Anantapur' => 'Andhra Pradesh',
        // Kerala
        'Kochi' => 'Kerala',
        'Cochin' => 'Kerala',
        'Trivandrum' => 'Kerala',
        'Thiruvananthapuram' => 'Kerala',
        'Calicut' => 'Kerala',
        'Kozhikode' => 'Kerala',
        'Thrissur' => 'Kerala',
        'Kollam' => 'Kerala',
        'Palakkad' => 'Kerala',
        'Alappuzha' => 'Kerala',
        'Alleppey' => 'Kerala',
        'Kannur' => 'Kerala',
        'Kottayam' => 'Kerala',
        'Malappuram' => 'Kerala',
        'Kasaragod' => 'Kerala',
        // Maharashtra
        'Pune' => 'Maharashtra',
        'Mumbai' => 'Maharashtra',
        'Navi Mumbai' => 'Maharashtra',
        'Thane' => 'Maharashtra',
        'Nagpur' => 'Maharashtra',
        'Nashik' => 'Maharashtra',
        'Aurangabad' => 'Maharashtra',
        'Chhatrapati Sambhajinagar' => 'Maharashtra',
        'Solapur' => 'Maharashtra',
        'Kolhapur' => 'Maharashtra',
        'Amravati' => 'Maharashtra',
        'Nanded' => 'Maharashtra',
        'Jalgaon' => 'Maharashtra',
        'Akola' => 'Maharashtra',
        // Delhi NCR & North
        'Delhi' => 'Delhi NCR',
        'New Delhi' => 'Delhi NCR',
        'Noida' => 'Uttar Pradesh',
        'Greater Noida' => 'Uttar Pradesh',
        'Gurgaon' => 'Haryana',
        'Gurugram' => 'Haryana',
        'Faridabad' => 'Haryana',
        'Ghaziabad' => 'Uttar Pradesh',
        'Meerut' => 'Uttar Pradesh',
        'Agra' => 'Uttar Pradesh',
        'Varanasi' => 'Uttar Pradesh',
        'Prayagraj' => 'Uttar Pradesh',
        'Allahabad' => 'Uttar Pradesh',
        'Lucknow' => 'Uttar Pradesh',
        'Kanpur' => 'Uttar Pradesh',
        'Bareilly' => 'Uttar Pradesh',
        'Aligarh' => 'Uttar Pradesh',
        'Moradabad' => 'Uttar Pradesh',
        'Gorakhpur' => 'Uttar Pradesh',
        // Gujarat
        'Ahmedabad' => 'Gujarat',
        'Surat' => 'Gujarat',
        'Vadodara' => 'Gujarat',
        'Baroda' => 'Gujarat',
        'Rajkot' => 'Gujarat',
        'Bhavnagar' => 'Gujarat',
        'Jamnagar' => 'Gujarat',
        'Gandhinagar' => 'Gujarat',
        'Junagadh' => 'Gujarat',
        'Anand' => 'Gujarat',
        // Rajasthan
        'Jaipur' => 'Rajasthan',
        'Jodhpur' => 'Rajasthan',
        'Kota' => 'Rajasthan',
        'Bikaner' => 'Rajasthan',
        'Ajmer' => 'Rajasthan',
        'Udaipur' => 'Rajasthan',
        'Bhilwara' => 'Rajasthan',
        'Alwar' => 'Rajasthan',
        // Punjab, Haryana & UTs
        'Chandigarh' => 'Punjab / Haryana',
        'Mohali' => 'Punjab',
        'Panchkula' => 'Haryana',
        'Ludhiana' => 'Punjab',
        'Amritsar' => 'Punjab',
        'Jalandhar' => 'Punjab',
        'Patiala' => 'Punjab',
        'Bathinda' => 'Punjab',
        'Panipat' => 'Haryana',
        'Ambala' => 'Haryana',
        'Karnal' => 'Haryana',
        'Rohtak' => 'Haryana',
        'Hisar' => 'Haryana',
        // West Bengal & East
        'Kolkata' => 'West Bengal',
        'Howrah' => 'West Bengal',
        'Durgapur' => 'West Bengal',
        'Asansol' => 'West Bengal',
        'Siliguri' => 'West Bengal',
        'Bhubaneswar' => 'Odisha',
        'Cuttack' => 'Odisha',
        'Rourkela' => 'Odisha',
        'Berhampur' => 'Odisha',
        'Sambalpur' => 'Odisha',
        'Patna' => 'Bihar',
        'Gaya' => 'Bihar',
        'Bhagalpur' => 'Bihar',
        'Muzaffarpur' => 'Bihar',
        'Ranchi' => 'Jharkhand',
        'Jamshedpur' => 'Jharkhand',
        'Dhanbad' => 'Jharkhand',
        'Bokaro' => 'Jharkhand',
        // Central India
        'Indore' => 'Madhya Pradesh',
        'Bhopal' => 'Madhya Pradesh',
        'Jabalpur' => 'Madhya Pradesh',
        'Gwalior' => 'Madhya Pradesh',
        'Ujjain' => 'Madhya Pradesh',
        'Raipur' => 'Chhattisgarh',
        'Bilaspur' => 'Chhattisgarh',
        'Bhilai' => 'Chhattisgarh',
        'Durg' => 'Chhattisgarh',
        // Northeast & Others
        'Guwahati' => 'Assam',
        'Shillong' => 'Meghalaya',
        'Agartala' => 'Tripura',
        'Imphal' => 'Manipur',
        'Aizawl' => 'Mizoram',
        'Kohima' => 'Nagaland',
        'Gangtok' => 'Sikkim',
        'Dehradun' => 'Uttarakhand',
        'Haridwar' => 'Uttarakhand',
        'Roorkee' => 'Uttarakhand',
        'Shimla' => 'Himachal Pradesh',
        'Jammu' => 'Jammu and Kashmir',
        'Srinagar' => 'Jammu and Kashmir',
        'Panaji' => 'Goa',
        'Margao' => 'Goa',
        'Vasco da Gama' => 'Goa',
        'Pondicherry' => 'Puducherry',
        'Puducherry' => 'Puducherry',
        // Global tech cities
        'Dubai' => 'UAE',
        'Abu Dhabi' => 'UAE',
        'Singapore' => 'Singapore',
        'London' => 'UK',
        'New York' => 'USA',
        'San Francisco' => 'USA',
        'Seattle' => 'USA',
        'Austin' => 'USA',
        'Toronto' => 'Canada',
        'Vancouver' => 'Canada',
        'Sydney' => 'Australia',
        'Melbourne' => 'Australia',
        'Berlin' => 'Germany',
        'Tokyo' => 'Japan',
        'Riyadh' => 'Saudi Arabia',
        'Doha' => 'Qatar',
        'Kuala Lumpur' => 'Malaysia',
    ];

    /**
     * Common Indian states and UTs list for geographic matching.
     */
    protected array $statesList = [
        'Tamil Nadu', 'Karnataka', 'Kerala', 'Telangana', 'Andhra Pradesh',
        'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh',
        'West Bengal', 'Punjab', 'Haryana', 'Delhi NCR', 'Delhi', 'Bihar',
        'Jharkhand', 'Odisha', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh',
        'Assam', 'Goa', 'Tripura', 'Meghalaya', 'Manipur', 'Nagaland', 'Mizoram',
        'Arunachal Pradesh', 'Sikkim', 'Jammu and Kashmir', 'Puducherry'
    ];

    /**
     * Extract text and metadata from an uploaded resume file.
     */
    public function processUpload(UploadedFile $file, ?int $userId = null): array
    {
        $originalFilename = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $fileSize = $file->getSize() ?: 0;

        // 1. Validate file extension & size (Max 15MB)
        if (!in_array($extension, ['pdf', 'docx', 'doc'])) {
            throw new Exception("Unsupported file format (.{$extension}). Please upload PDF or DOCX format.");
        }

        if ($fileSize > 15 * 1024 * 1024) {
            throw new Exception("File size exceeds 15MB limit.");
        }

        // 2. Ensure storage folder exists
        try {
            if (!Storage::disk('local')->exists('resumes')) {
                Storage::disk('local')->makeDirectory('resumes');
            }
        } catch (\Throwable $e) {}

        // 3. Compute SHA-256 hash for duplicate detection
        $realPath = null;
        try {
            $realPath = $file->getRealPath() ?: $file->getPathname();
        } catch (\Throwable $e) {
            $realPath = null;
        }

        $fileHash = ($realPath && file_exists($realPath)) ? @hash_file('sha256', $realPath) : null;

        // 4. Store file securely in private storage (not accessible via public HTTP)
        $storedFilename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        $filePath = null;

        try {
            $filePath = $file->storeAs('resumes', $storedFilename, 'local');
        } catch (\Throwable $e) {
            $filePath = false;
        }

        if (!$filePath) {
            // Direct filesystem fallback
            $targetDir = storage_path('app/private/resumes');
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0775, true);
            }
            $targetPath = $targetDir . DIRECTORY_SEPARATOR . $storedFilename;
            if ($realPath && file_exists($realPath) && @copy($realPath, $targetPath)) {
                $filePath = 'resumes/' . $storedFilename;
            } else {
                try {
                    $filePath = $file->storeAs('resumes', $storedFilename, 'public');
                } catch (\Throwable $e) {
                    $filePath = 'resumes/' . $storedFilename;
                }
            }
        }

        // Compute hash from stored copy if not previously computed
        if (!$fileHash) {
            try {
                $storedFullPath = Storage::disk('local')->path($filePath);
                if (file_exists($storedFullPath)) {
                    $fileHash = @hash_file('sha256', $storedFullPath);
                }
            } catch (\Throwable $e) {}
        }
        if (!$fileHash) {
            $fileHash = hash('sha256', $originalFilename . '_' . $fileSize . '_' . time());
        }

        // 5. Extract raw text
        $rawText = '';
        $ocrNeeded = false;
        $parsingStatus = 'success';
        $parsingError = null;

        try {
            $absolutePath = null;
            try {
                $absolutePath = Storage::disk('local')->path($filePath);
            } catch (\Throwable $e) {
                $absolutePath = null;
            }

            if (!$absolutePath || !file_exists($absolutePath)) {
                $checkPaths = [
                    storage_path('app/private/' . $filePath),
                    storage_path('app/' . $filePath),
                    storage_path('app/public/' . $filePath),
                ];
                foreach ($checkPaths as $cp) {
                    if (file_exists($cp)) {
                        $absolutePath = $cp;
                        break;
                    }
                }
            }

            if ($absolutePath && file_exists($absolutePath)) {
                if ($extension === 'pdf') {
                    $rawText = $this->extractTextFromPdf($absolutePath);
                } elseif ($extension === 'docx') {
                    $rawText = $this->extractTextFromDocx($absolutePath);
                } elseif ($extension === 'doc') {
                    $rawText = $this->extractTextFromDoc($absolutePath);
                }
            } else {
                $parsingStatus = 'partial';
                $parsingError = 'File was stored but could not be accessed immediately for text extraction.';
            }

            // Check if extracted text is suspiciously short (scanned PDF or photo)
            if (mb_strlen(trim($rawText)) < 30) {
                $ocrNeeded = true;
                $parsingStatus = 'partial';
                $parsingError = 'The document contains minimal or no extractable text. It may be a scanned image or photo. Manual entry or review is recommended.';
            }
            $rawText = self::cleanUtf8($rawText);
        } catch (\Throwable $e) {
            $parsingStatus = 'failed';
            $parsingError = 'Text extraction notice: ' . $e->getMessage();
            $rawText = '';
        }

        // 6. Deterministic entity extraction
        $extractedData = $this->parseResumeText($rawText, $originalFilename);
        $extractedData = self::sanitizeRecursive($extractedData);

        return [
            'original_filename' => $originalFilename,
            'stored_filename' => $storedFilename,
            'file_path' => $filePath,
            'file_mime' => $mime,
            'file_size' => $fileSize,
            'file_hash' => $fileHash,
            'parsing_status' => $parsingStatus,
            'parsing_error' => $parsingError,
            'ocr_needed' => $ocrNeeded,
            'raw_text' => self::cleanUtf8($rawText),
            'extracted_data' => $extractedData,
        ];
    }

    /**
     * Clean and enforce valid UTF-8 string, removing illegal bytes and invisible control chars.
     */
    public static function cleanUtf8(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        // 1. Convert to UTF-8 from detected encoding or drop illegal bytes
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII']);
        }

        // 2. Remove null bytes and non-printable control characters except \r, \n, \t
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // 3. Ensure valid UTF-8 sequence, ignoring anything broken
        $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $text);
        if ($clean !== false) {
            $text = $clean;
        }

        return $text;
    }

    /**
     * Recursively sanitize all array/string fields to valid UTF-8.
     */
    public static function sanitizeRecursive($data)
    {
        if (is_string($data)) {
            return self::cleanUtf8($data);
        }
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $val) {
                $cleanKey = is_string($key) ? self::cleanUtf8($key) : $key;
                $result[$cleanKey] = self::sanitizeRecursive($val);
            }
            return $result;
        }
        return $data;
    }

    /**
     * Extract text from PDF using Smalot\PdfParser with binary stream fallback.
     */
    public function extractTextFromPdf(string $absolutePath): string
    {
        $rawText = '';
        try {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($absolutePath);
            $rawText = $pdf->getText();
        } catch (\Throwable $e) {
            $rawText = '';
        }

        // If Smalot failed or returned minimal text, try direct binary stream extraction
        if (mb_strlen(trim($rawText)) < 30) {
            $fallbackText = $this->extractTextFromPdfBinary($absolutePath);
            if (mb_strlen(trim($fallbackText)) > mb_strlen(trim($rawText))) {
                $rawText = $fallbackText;
            }
        }

        return $rawText;
    }

    /**
     * Fallback text extractor that decodes PDF FlateDecode streams directly.
     */
    public function extractTextFromPdfBinary(string $absolutePath): string
    {
        if (!file_exists($absolutePath) || !is_readable($absolutePath)) {
            return '';
        }

        $content = @file_get_contents($absolutePath);
        if (!$content) {
            return '';
        }

        $extracted = [];

        // 1. Locate all stream ... endstream blocks
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $content, $streamMatches)) {
            foreach ($streamMatches[1] as $stream) {
                // Try decompressing with gzuncompress / gzinflate
                $decompressed = @gzuncompress($stream);
                if ($decompressed === false) {
                    $decompressed = @gzinflate($stream);
                }
                if ($decompressed === false) {
                    $decompressed = $stream;
                }

                // Extract text chunks inside parentheses e.g. (Candidate Name) Tj or [(J) (ohn)] TJ
                if (preg_match_all('/\((.*?)\)\s*(?:Tj|TJ|\')/s', $decompressed, $textMatches)) {
                    foreach ($textMatches[1] as $chunk) {
                        $cleanChunk = preg_replace('/\\\([()\\\\])/', '$1', $chunk);
                        if (mb_strlen(trim($cleanChunk)) > 0) {
                            $extracted[] = $cleanChunk;
                        }
                    }
                }
            }
        }

        // 2. Also extract any plain ASCII strings of at least 4 characters if streams yielded nothing
        if (empty($extracted)) {
            if (preg_match_all('/[a-zA-Z0-9._%+\-@\s]{4,}/', $content, $asciiMatches)) {
                $extracted = $asciiMatches[0];
            }
        }

        return implode(' ', $extracted);
    }

    /**
     * Extract text from DOCX by reading XML structure inside ZIP archive.
     */
    public function extractTextFromDocx(string $absolutePath): string
    {
        if (!class_exists('ZipArchive')) {
            throw new Exception("PHP ZipArchive extension is not available on this server.");
        }

        $zip = new ZipArchive();
        if ($zip->open($absolutePath) !== true) {
            throw new Exception("Unable to open DOCX file archive.");
        }

        $content = '';
        if (($index = $zip->locateName('word/document.xml')) !== false) {
            $xmlData = $zip->getFromIndex($index);
            // Replace paragraph & line breaks
            $xmlData = str_replace(['</w:p>', '</w:tr>'], "\n", $xmlData);
            $xmlData = str_replace('</w:tc>', "\t", $xmlData);
            $content = strip_tags($xmlData);
        }

        $zip->close();
        return $content;
    }

    /**
     * Basic fallback for legacy .doc binary files.
     */
    public function extractTextFromDoc(string $absolutePath): string
    {
        if (!file_exists($absolutePath) || !is_readable($absolutePath)) {
            return '';
        }
        $line = @file_get_contents($absolutePath);
        if (!$line) {
            return '';
        }
        $lines = [];
        if (preg_match_all('/[a-zA-Z0-9\s.,@:\-\/()]{4,}/', $line, $matches)) {
            $lines = $matches[0];
        }
        return implode(" ", $lines);
    }

    /**
     * Extract fallback candidate name from filename when resume text yields no high confidence name.
     */
    public function extractNameFromFilename(string $filename): ?string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        // Remove common resume prefixes/suffixes and noise
        $name = preg_replace('/^(?:resume|cv|biodata|profile|curriculum_vitae)[_\-\s]*/i', '', $name);
        $name = preg_replace('/[_\-\s]*(?:resume|cv|biodata|profile|updated|latest|\d{4})*$/i', '', $name);
        $name = preg_replace('/[_\-]+/', ' ', $name);
        $name = trim($name);

        if (mb_strlen($name) >= 3 && mb_strlen($name) <= 40 && preg_match('/^[a-zA-Z\s\'.]+$/', $name)) {
            $words = array_values(array_filter(explode(' ', $name)));
            if (count($words) >= 1 && count($words) <= 4) {
                return ucwords(strtolower(implode(' ', $words)));
            }
        }
        return null;
    }

    /**
     * Parse raw extracted resume text into structured candidate fields deterministically.
     * Strictly extracts only: fullname, email, mobile number, location, role, experience, education, key skills.
     */
    public function parseResumeText(string $text, ?string $originalFilename = null): array
    {
        $fieldsForReview = [];
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $cleanLines = array_values(array_filter(array_map('trim', $lines)));

        // 1. Email extraction (with RFC validation)
        $email = null;
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches)) {
            $candidateEmail = strtolower(trim($matches[0]));
            if (filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
                $email = $candidateEmail;
            }
        }
        if (!$email) {
            $fieldsForReview[] = 'email';
        }

        // 2. Mobile Phone extraction (handles +91, Indian 10-digit mobile, and international formats)
        $phone = null;
        $altPhone = null;
        if (preg_match_all('/(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}/', $text, $phoneMatches)) {
            $phone = preg_replace('/[^\d+]/', '', $phoneMatches[0][0]);
            if (isset($phoneMatches[0][1])) {
                $altPhone = preg_replace('/[^\d+]/', '', $phoneMatches[0][1]);
            }
        } elseif (preg_match_all('/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/', $text, $genPhoneMatches)) {
            $phone = preg_replace('/[^\d+]/', '', $genPhoneMatches[0][0]);
        }

        if (!$phone) {
            $fieldsForReview[] = 'phone';
        }

        // 3. Full Name extraction (from header lines, excluding headings, with filename fallback)
        $fullName = $this->extractCandidateName($cleanLines, $email);
        if (!$fullName && $originalFilename) {
            $fullName = $this->extractNameFromFilename($originalFilename);
        }

        $firstName = '';
        $lastName = '';
        if ($fullName) {
            $parts = explode(' ', $fullName, 2);
            $firstName = $parts[0] ?? '';
            $lastName = $parts[1] ?? '';
        } else {
            $fieldsForReview[] = 'full_name';
        }

        // 4. Robust Location extraction (handles labels, header contact blocks, and city/state databases)
        $locationData = $this->extractLocation($text, $cleanLines);
        $currentLocation = $locationData['current_location'];
        $city = $locationData['city'];
        $state = $locationData['state'];
        $country = $locationData['country'];

        if (!$currentLocation) {
            $fieldsForReview[] = 'current_location';
        }

        // 5. Key Skills extraction
        $extractedSkills = $this->extractSkills($text);
        $keySkillsList = array_values(array_unique(array_column($extractedSkills, 'skill_name')));
        if (empty($keySkillsList)) {
            $fieldsForReview[] = 'skills';
        }

        // 6. Experience (Years) extraction (from explicit mentions or date intervals)
        $experienceData = $this->calculateExperience($text);
        $totalExperienceYears = $experienceData['years'];
        if ($totalExperienceYears === null || $totalExperienceYears == 0) {
            $fieldsForReview[] = 'total_experience_years';
        }

        // 7. Role extraction
        $roleData = $this->extractRoleAndTitle($text, $extractedSkills);
        $primaryRole = $roleData['role'];
        $currentTitle = $roleData['title'];
        if (!$primaryRole) {
            $fieldsForReview[] = 'primary_role';
        }

        // 8. Education extraction
        $educationList = $this->extractEducation($text);
        $highestQualification = $educationList[0]['degree'] ?? null;
        $degree = $educationList[0]['degree'] ?? null;
        $specialization = $educationList[0]['specialization'] ?? null;
        if (!$highestQualification) {
            $fieldsForReview[] = 'highest_qualification';
        }

        return [
            // STRICTLY REQUESTED FIELDS:
            'full_name' => $fullName,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'mobile_number' => $phone,
            'alternate_phone' => $altPhone,
            'location' => $currentLocation,
            'current_location' => $currentLocation,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'role' => $primaryRole,
            'primary_role' => $primaryRole,
            'current_title' => $currentTitle,
            'experience' => $totalExperienceYears,
            'total_experience_years' => $totalExperienceYears,
            'relevant_experience_years' => $totalExperienceYears,
            'education' => $educationList,
            'highest_qualification' => $highestQualification,
            'degree' => $degree,
            'specialization' => $specialization,
            'key_skills' => $keySkillsList,
            'skills' => $extractedSkills,

            // STRICTLY EMPTY/NULL FOR NON-REQUESTED FIELDS:
            'current_company' => null,
            'previous_companies' => [],
            'linkedin_url' => null,
            'github_url' => null,
            'portfolio_url' => null,
            'current_salary' => null,
            'expected_salary' => null,
            'notice_period_days' => null,
            'notice_period_text' => null,
            'professional_summary' => null,
            'certifications' => [],
            'languages' => [],
            'employment_history' => [],

            'fields_for_review' => array_values(array_unique($fieldsForReview)),
        ];
    }

    /**
     * Enhanced and robust location extraction.
     * Extracts candidate location strictly from labeled fields or header contact blocks.
     * If not found, returns null (leaves blank).
     */
    public function extractLocation(string $text, array $cleanLines): array
    {
        $city = null;
        $state = null;
        $country = null;
        $locationStr = null;

        // 1. Check explicit labeled lines: Location:, Current Location:, Address:, City:, Place:, Native:, Hometown:
        $labelPattern = '/(?:(?:current|preferred|base|work|present|residence|permanent|native|contact)?\s*(?:location|address|city|place|native|hometown|residing\s+at))\s*[:\-\|\t]\s*([^\r\n;\t]+)/i';
        if (preg_match($labelPattern, $text, $matches)) {
            $rawLoc = trim($matches[1]);
            $cleanLoc = preg_replace('/\s*\([^)]*\)/', '', $rawLoc);
            $cleanLoc = preg_replace('/[,\s]+India\b/i', '', $cleanLoc);
            $cleanLoc = preg_replace('/[\s,-]+\d{5,6}\b/', '', $cleanLoc); // remove pincodes
            $cleanLoc = trim($cleanLoc, " \t\n\r\0\x0B,-/|");

            if (mb_strlen($cleanLoc) >= 3 && mb_strlen($cleanLoc) <= 100) {
                $locationStr = $cleanLoc;

                // Try to resolve city & state from this string
                foreach ($this->citiesDatabase as $c => $s) {
                    if (preg_match('/\b' . preg_quote($c, '/') . '\b/i', $cleanLoc)) {
                        $city = $c;
                        $state = $s;
                        break;
                    }
                }
                if (!$state) {
                    foreach ($this->statesList as $s) {
                        if (preg_match('/\b' . preg_quote($s, '/') . '\b/i', $cleanLoc)) {
                            $state = $s;
                            break;
                        }
                    }
                }
            }
        }

        // 2. Check header lines (first 12 lines) - thoroughly cleaning noise
        if (!$locationStr) {
            $headerLines = array_slice($cleanLines, 0, 12);
            foreach ($headerLines as $line) {
                if (mb_strlen($line) > 200) continue;

                // Strip email, urls, and phone numbers from the line
                $lineNoContact = preg_replace('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', '', $line);
                $lineNoContact = preg_replace('/https?:\/\/\S+/', '', $lineNoContact);
                $lineNoContact = preg_replace('/(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}/', '', $lineNoContact);
                $lineNoContact = preg_replace('/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/', '', $lineNoContact);
                $lineNoContact = preg_replace('/[\d\s-]{10,}/', '', $lineNoContact);

                // Check directly against cities in this cleaned header line
                foreach ($this->citiesDatabase as $c => $s) {
                    if (preg_match('/\b' . preg_quote($c, '/') . '\b/i', $lineNoContact)) {
                        $city = $c;
                        $state = $s;
                        $locationStr = "{$c}, {$s}";
                        break 2;
                    }
                }

                // Check directly against Indian states in this cleaned header line
                if (!$locationStr) {
                    foreach ($this->statesList as $s) {
                        if (preg_match('/\b' . preg_quote($s, '/') . '\b/i', $lineNoContact)) {
                            $state = $s;
                            $locationStr = $s;
                            break 2;
                        }
                    }
                }
            }
        }

        // 3. Check for Postal PIN code in header lines to derive City/State
        if (!$locationStr) {
            $topText = implode("\n", array_slice($cleanLines, 0, 15));
            if (preg_match('/\b(6[0-4]\d{4})\b/', $topText)) {
                $state = 'Tamil Nadu';
                if (preg_match('/\b(600\d{3})\b/', $topText)) { $city = 'Chennai'; }
                elseif (preg_match('/\b(641\d{3})\b/', $topText)) { $city = 'Coimbatore'; }
                elseif (preg_match('/\b(625\d{3})\b/', $topText)) { $city = 'Madurai'; }
                $locationStr = $city ? "{$city}, {$state}" : $state;
            } elseif (preg_match('/\b(5[6-9]\d{4})\b/', $topText)) {
                $state = 'Karnataka';
                if (preg_match('/\b(560\d{3})\b/', $topText)) { $city = 'Bengaluru'; }
                $locationStr = $city ? "{$city}, {$state}" : $state;
            } elseif (preg_match('/\b(50\d{4})\b/', $topText)) {
                $state = 'Telangana';
                if (preg_match('/\b(500\d{3})\b/', $topText)) { $city = 'Hyderabad'; }
                $locationStr = $city ? "{$city}, {$state}" : $state;
            }
        }

        // If not found in labeled field or header line, leave it null!
        if ($locationStr) {
            $country = 'India';
            if ($city && !$locationStr) {
                $locationStr = $state ? "{$city}, {$state}" : $city;
            }
        }

        return [
            'location' => $locationStr,
            'current_location' => $locationStr,
            'city' => $city ?? ($locationStr ? trim(explode(',', $locationStr)[0]) : null),
            'state' => $state,
            'country' => $country,
        ];
    }

    /**
     * Heuristic candidate name extraction from top lines.
     * Leaves blank (null) if no high confidence name is found.
     */
    protected function extractCandidateName(array $cleanLines, ?string $email): ?string
    {
        $blacklist = [
            'resume', 'curriculum', 'vitae', 'cv', 'profile', 'summary',
            'contact', 'phone', 'email', 'address', 'page', 'career',
            'objective', 'personal', 'details', 'experience', 'education',
            'skills', 'work', 'projects', 'certifications', 'software',
            'developer', 'engineer', 'manager', 'lead', 'specialist',
            'declaration', 'hobbies', 'languages', 'strengths', 'interests'
        ];

        for ($i = 0; $i < min(8, count($cleanLines)); $i++) {
            $line = trim($cleanLines[$i]);
            if (mb_strlen($line) < 3 || mb_strlen($line) > 40) {
                continue;
            }

            // Exclude lines with email, phone digits, or url
            if (str_contains($line, '@') || preg_match('/\d{5,}/', $line) || str_contains($line, 'http') || str_contains($line, 'www.')) {
                continue;
            }

            $lower = strtolower($line);
            $hasBlacklist = false;
            foreach ($blacklist as $b) {
                if (str_contains($lower, $b)) {
                    $hasBlacklist = true;
                    break;
                }
            }
            if ($hasBlacklist) {
                continue;
            }

            // Valid candidate name is typically 2-4 alphabetical words (Title Case or UPPERCASE)
            if (preg_match('/^[A-Za-z.\']+(?:\s+[A-Za-z.\']+){1,3}$/', $line)) {
                $words = explode(' ', $line);
                if (count($words) >= 2) {
                    return ucwords(strtolower($line));
                }
            }
        }

        // Derive from email username (e.g. ajith.kumar@gmail.com -> Ajith Kumar)
        if ($email) {
            $username = explode('@', $email)[0];
            $cleanUser = preg_replace('/[0-9]+/', '', $username);
            $parts = preg_split('/[._-]/', $cleanUser);
            $parts = array_filter(array_map('ucfirst', $parts));
            if (count($parts) >= 2) {
                return implode(' ', $parts);
            }
        }

        // Leave blank if no valid name found (do NOT fallback to random lines)
        return null;
    }

    /**
     * Match skills against the curated skill bank.
     */
    protected function extractSkills(string $text): array
    {
        $foundSkills = [];
        foreach ($this->skillsDatabase as $skill => $meta) {
            $pattern = '/\b' . preg_quote($skill, '/') . '\b/i';
            if (preg_match($pattern, $text)) {
                $foundSkills[] = [
                    'skill_name' => $skill,
                    'normalized_skill_name' => strtolower($skill),
                    'category' => $meta['category'],
                    'proficiency' => 'intermediate',
                    'years_of_experience' => null,
                ];
            }
        }

        return $foundSkills;
    }

    /**
     * Calculate experience from explicit mentions and date intervals.
     */
    protected function calculateExperience(string $text): array
    {
        // 1. Explicit mention check:
        // Pattern A: "Total Experience: 4 Years 6 Months", "Experience: 3.5 Years", "Exp: 2 Years"
        if (preg_match('/(?:total|overall|relevant|industry|work)?\s*(?:experience|exp)\s*[:\-]\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)?(?:\s*(?:and\s*)?(\d+)\s*(?:months?|mos?))?/i', $text, $matches)) {
            $yrs = (float)$matches[1];
            if (!empty($matches[2])) {
                $yrs += round(((int)$matches[2]) / 12, 1);
            }
            if ($yrs > 0 && $yrs <= 40) {
                return ['years' => $yrs, 'source' => 'explicit'];
            }
        }

        // Pattern B: "4.5 years of experience", "5+ years in software", "3 years and 4 months of experience"
        if (preg_match('/(?:total|overall|with|having)?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*(?:and\s*)?(\d+)\s*(?:months?|mos?))?(?:\s+(?:of|in|relevant|total|industry|hands-on|professional|extensive|commercial|work))*\s+experience/i', $text, $matches)) {
            $yrs = (float)$matches[1];
            if (!empty($matches[2])) {
                $yrs += round(((int)$matches[2]) / 12, 1);
            }
            if ($yrs > 0 && $yrs <= 40) {
                return ['years' => $yrs, 'source' => 'explicit'];
            }
        }

        // 2. Parse employment date intervals from experience section (exclude education section)
        $experienceText = $text;
        if (preg_match('/(?:work\s+experience|professional\s+experience|employment\s+history|experience\s*[\n:])([\s\S]+?)(?:\n\s*(?:education|academic|qualifications|skills|projects|certifications)\b|$)/i', $text, $secMatch)) {
            $experienceText = $secMatch[1];
        }

        $dateRanges = [];
        $months = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
        $pattern = '/(?:(' . $months . ')[\s\',.]*)?((?:19|20)\d{2})\s*(?:-|–|—|to)\s*(?:(' . $months . ')[\s\',.]*)?((?:19|20)\d{2}|Present|Current|Till Date|Now)/i';

        if (preg_match_all($pattern, $experienceText, $matches, PREG_SET_ORDER)) {
            $currentYear = (int)date('Y');
            $currentMonth = (int)date('m');

            $intervals = [];
            foreach ($matches as $m) {
                $startYear = (int)$m[2];
                $startMonth = !empty($m[1]) ? (int)date('m', strtotime($m[1])) : 1;
                $startTotalMonths = ($startYear * 12) + $startMonth;

                $endStr = strtolower($m[4]);
                if (in_array($endStr, ['present', 'current', 'till date', 'now'])) {
                    $endYear = $currentYear;
                    $endMonth = $currentMonth;
                } else {
                    $endYear = (int)$m[4];
                    $endMonth = !empty($m[3]) ? (int)date('m', strtotime($m[3])) : 12;
                }
                $endTotalMonths = ($endYear * 12) + $endMonth;

                if ($endTotalMonths >= $startTotalMonths && ($endYear - $startYear) <= 30) {
                    $intervals[] = [$startTotalMonths, $endTotalMonths];
                }
            }

            if (!empty($intervals)) {
                // Merge overlapping intervals to prevent double-counting
                usort($intervals, fn($a, $b) => $a[0] <=> $b[0]);
                $merged = [];
                $curr = $intervals[0];

                for ($i = 1; $i < count($intervals); $i++) {
                    if ($intervals[$i][0] <= $curr[1]) {
                        $curr[1] = max($curr[1], $intervals[$i][1]);
                    } else {
                        $merged[] = $curr;
                        $curr = $intervals[$i];
                    }
                }
                $merged[] = $curr;

                $totalMonths = 0;
                foreach ($merged as $interval) {
                    $totalMonths += ($interval[1] - $interval[0] + 1);
                }

                $calculatedYears = round($totalMonths / 12, 1);
                if ($calculatedYears > 0 && $calculatedYears <= 35) {
                    return ['years' => $calculatedYears, 'source' => 'intervals'];
                }
            }
        }

        // Leave blank if no experience determined
        return ['years' => null, 'source' => 'unknown'];
    }

    /**
     * Identify primary role and current title.
     * If not found at first in header/labels, looks specifically at the Experience section.
     * Leaves blank if no accurate role is determined.
     */
    protected function extractRoleAndTitle(string $text, array $skills): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $headerLines = array_slice(array_values(array_filter(array_map('trim', $lines))), 0, 8);

        $commonRoles = [
            'Full Stack Developer' => '/\bfull[\s-]stack(?:\s+(?:developer|engineer|web developer|programmer))?\b/i',
            'Laravel Developer' => '/\blaravel(?:\s+(?:developer|engineer|specialist|backend developer))?\b/i',
            'PHP Developer' => '/\bphp(?:\s+(?:developer|programmer|engineer|backend developer))?\b/i',
            'React Developer' => '/\breact(?:\.js)?(?:\s+(?:developer|engineer|frontend developer))?\b/i',
            'Angular Developer' => '/\bangular(?:\.js)?(?:\s+(?:developer|engineer|frontend developer))?\b/i',
            'Vue.js Developer' => '/\bvue(?:\.js)?(?:\s+(?:developer|engineer))?\b/i',
            'Frontend Developer' => '/\bfront[\s-]end(?:\s+(?:developer|engineer|web developer))?\b/i',
            'Backend Developer' => '/\bback[\s-]end(?:\s+(?:developer|engineer))?\b/i',
            'Node.js Developer' => '/\bnode(?:\.js)?(?:\s+(?:developer|engineer))?\b/i',
            'Python Developer' => '/\bpython(?:\s+(?:developer|engineer|programmer))?\b/i',
            'Java Developer' => '/\bjava(?:\s+(?:developer|engineer|programmer))?\b/i',
            'DotNet Developer' => '/\b(?:\.net|dotnet|c#)(?:\s+(?:developer|engineer|programmer))?\b/i',
            'WordPress Developer' => '/\bwordpress(?:\s+(?:developer|designer))?\b/i',
            'DevOps Engineer' => '/\bdevops(?:\s+(?:engineer|consultant|specialist))?\b/i',
            'Cloud Engineer' => '/\bcloud(?:\s+(?:engineer|architect|specialist))?\b/i',
            'UI/UX Designer' => '/\b(?:ui\/ux|ui\s+designer|ux\s+designer|product\s+designer|web\s+designer)\b/i',
            'Graphic Designer' => '/\bgraphic\s+designer\b/i',
            'QA Engineer' => '/\b(?:qa|quality assurance|automation tester|test engineer|software tester|manual tester)\b/i',
            'Mobile App Developer' => '/\b(?:flutter|react native|android|ios|mobile)\s+(?:developer|engineer)\b/i',
            'Android Developer' => '/\bandroid(?:\s+(?:developer|engineer))?\b/i',
            'iOS Developer' => '/\bios(?:\s+(?:developer|engineer))?\b/i',
            'Project Manager' => '/\b(?:project manager|scrum master|technical lead|tech lead|delivery manager)\b/i',
            'Product Manager' => '/\bproduct\s+manager\b/i',
            'Data Analyst' => '/\b(?:data analyst|business analyst|bi analyst|power bi developer)\b/i',
            'Data Scientist' => '/\b(?:data scientist|machine learning engineer|ai engineer|ml engineer)\b/i',
            'Database Administrator' => '/\b(?:database administrator|dba|database engineer)\b/i',
            'System Administrator' => '/\b(?:system administrator|sysadmin|network engineer|systems engineer)\b/i',
            'Cybersecurity Analyst' => '/\b(?:cybersecurity|information security|security analyst|security engineer)\b/i',
            'SEO Specialist' => '/\b(?:seo specialist|seo executive|digital marketing executive|digital marketing specialist)\b/i',
            'Content Writer' => '/\b(?:content writer|technical writer|copywriter)\b/i',
            'HR Executive' => '/\b(?:hr executive|talent acquisition specialist|technical recruiter|hr manager|recruiter)\b/i',
            'Business Development Executive' => '/\b(?:business development executive|bde|sales executive|account manager)\b/i',
            'Software Engineer' => '/\b(?:software engineer|software developer|system engineer|associate software engineer|senior software engineer)\b/i',
        ];

        // 1. Priority 1 (At first): Check Header lines (first 8 lines)
        foreach ($headerLines as $line) {
            if (mb_strlen($line) > 60) continue;
            $cleanHLine = preg_replace('/^(?:designation|role|title|position|current\s+role)\s*[:\-]\s*/i', '', trim($line));
            $cleanHLine = trim($cleanHLine, " \t\n\r\0\x0B,-|/•()");
            foreach ($commonRoles as $role => $pattern) {
                if (preg_match($pattern, $cleanHLine)) {
                    return ['role' => $role, 'title' => ucwords($cleanHLine)];
                }
            }
        }

        // 2. Priority 2 (At first): Explicit role label at top (e.g. "Role: Full Stack Developer", "Designation: PHP Developer")
        if (preg_match('/(?:designation|role|title|position|current\s+role)\s*[:\-]\s*([^\r\n;\t]+)/i', $text, $labelMatches)) {
            $matchedTitle = trim($labelMatches[1]);
            $matchedTitle = preg_replace('/^(?:designation|role|title|position|current\s+role)\s*[:\-]\s*/i', '', $matchedTitle);
            $matchedTitle = trim($matchedTitle, " \t\n\r\0\x0B,-|/•()");

            foreach ($commonRoles as $role => $pattern) {
                if (preg_match($pattern, $matchedTitle)) {
                    return ['role' => $role, 'title' => ucwords($matchedTitle)];
                }
            }
            if (mb_strlen($matchedTitle) >= 3 && mb_strlen($matchedTitle) <= 40) {
                return ['role' => ucwords($matchedTitle), 'title' => ucwords($matchedTitle)];
            }
        }

        // 3. Priority 3: Look specifically at the EXPERIENCE SECTION if role is not identified at first
        $expRole = $this->extractRoleFromExperience($text, $commonRoles);
        if ($expRole) {
            return $expRole;
        }

        // 4. Priority 4: Pattern match across full text
        foreach ($commonRoles as $role => $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return ['role' => $role, 'title' => ucwords($matches[0])];
            }
        }

        // Leave blank if no confident role identified
        return ['role' => null, 'title' => null];
    }

    /**
     * Inspect specifically the Experience / Employment History section to extract the candidate's latest role.
     */
    protected function extractRoleFromExperience(string $text, array $commonRoles): ?array
    {
        // 1. Locate the Experience section
        $expSection = null;
        $sectionPattern = '/(?:(?:work|professional|employment|career|relevant|job)\s+(?:experience|history)|(?:experience|employment)\s*[\n:])([\s\S]+?)(?:\n\s*(?:education|academic|qualifications|technical\s+skills|skills|projects|certifications|achievements|declaration|personal\s+details)\b|$)/i';

        if (preg_match($sectionPattern, $text, $secMatch)) {
            $expSection = $secMatch[1];
        } else {
            // Fallback: search for "Experience" keyword
            if (preg_match('/\b(?:work\s+experience|professional\s+experience|experience)\b[\s\S]+/i', $text, $secMatch)) {
                $expSection = $secMatch[0];
            }
        }

        if (!$expSection) {
            return null;
        }

        // 2. Check explicit designation/role label inside experience section
        if (preg_match('/(?:designation|role|title|position|job\s+title)\s*[:\-]\s*([^\r\n;\t]+)/i', $expSection, $lbl)) {
            $rawTitle = trim($lbl[1]);
            $rawTitle = preg_replace('/^(?:role|designation|title|position|job\s+title)\s*[:\-]\s*/i', '', $rawTitle);
            $rawTitle = trim($rawTitle, " \t\n\r\0\x0B,-|/•()");

            if (mb_strlen($rawTitle) >= 3 && mb_strlen($rawTitle) <= 50) {
                foreach ($commonRoles as $role => $pattern) {
                    if (preg_match($pattern, $rawTitle)) {
                        return ['role' => $role, 'title' => ucwords($rawTitle)];
                    }
                }
                return ['role' => ucwords($rawTitle), 'title' => ucwords($rawTitle)];
            }
        }

        // 3. Inspect lines in the Experience section (prioritizing the most recent entries at top)
        $lines = preg_split('/\r\n|\r|\n/', $expSection);
        $cleanLines = array_values(array_filter(array_map('trim', $lines)));

        foreach ($cleanLines as $line) {
            if (mb_strlen($line) < 3 || mb_strlen($line) > 85) continue;

            // Strip out common date expressions, label prefixes, bullet points, and trailing notes
            $cleanLine = preg_replace('/(?:\(|\[)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/\d{4}|\d{4})\s*(?:-|–|—|to)\s*(?:Present|Current|Till Date|Now|\d{1,2}\/\d{4}|\d{4})(?:\)|\])?/i', '', $line);
            $cleanLine = preg_replace('/^(?:role|designation|title|position|job\s+title)\s*[:\-]\s*/i', '', $cleanLine);
            $cleanLine = preg_replace('/^[•\-\*·\d\.\s]+/', '', $cleanLine);
            $cleanLine = trim($cleanLine, " \t\n\r\0\x0B,-|/•()");

            // A. Check against common canonical roles
            foreach ($commonRoles as $role => $pattern) {
                if (preg_match($pattern, $cleanLine, $tm)) {
                    $matched = trim($tm[0]);
                    return ['role' => $role, 'title' => ucwords($matched)];
                }
            }

            // B. Check for standard title structure: e.g. "Senior Software Engineer", "Associate QA Tester", "PHP Programmer"
            $titleRegex = '/\b(?:Senior|Junior|Lead|Principal|Associate|Chief|Staff|Trainee|Assistant)?\s*(?:[A-Za-z\/\.\+#]+(?:\s+[A-Za-z\/\.\+#]+){0,2})\s+(?:Developer|Engineer|Programmer|Architect|Consultant|Specialist|Analyst|Designer|Administrator|Manager|Executive|Tester|Scientist|Officer)\b/i';
            if (preg_match($titleRegex, $cleanLine, $tm)) {
                $matched = trim($tm[0]);
                if (mb_strlen($matched) >= 4 && mb_strlen($matched) <= 45) {
                    return ['role' => ucwords($matched), 'title' => ucwords($matched)];
                }
            }
        }

        return null;
    }

    /**
     * Extract current and previous employers.
     */
    protected function extractCompanies(string $text, array $lines): array
    {
        return [
            'current' => null,
            'previous' => [],
        ];
    }

    /**
     * Extract degree and education details.
     * Leaves empty (blank) if no recognized degree is found.
     */
    protected function extractEducation(string $text): array
    {
        $education = [];
        $degrees = [
            'B.Tech' => '/\b(?:b\.?\s*tech|bachelor of technology)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'B.E.' => '/\b(?:b\.?\s*e\.?|bachelor of engineering)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'M.Tech' => '/\b(?:m\.?\s*tech|master of technology)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'M.E.' => '/\b(?:m\.?\s*e\.?|master of engineering)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'MCA' => '/\b(?:mca|master of computer applications?)\b/i',
            'BCA' => '/\b(?:bca|bachelor of computer applications?)\b/i',
            'B.Sc' => '/\b(?:b\.?\s*sc|bachelor of science|b\.s\.)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'M.Sc' => '/\b(?:m\.?\s*sc|master of science|m\.s\.)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'MBA' => '/\b(?:mba|master of business administration)\b/i',
            'BBA' => '/\b(?:bba|bachelor of business administration)\b/i',
            'B.Com' => '/\b(?:b\.?\s*com|bachelor of commerce)\b/i',
            'M.Com' => '/\b(?:m\.?\s*com|master of commerce)\b/i',
            'Diploma' => '/\b(?:diploma|polytechnic)\b(?:[\s\-\(]+(?:in\s+)?([a-zA-Z\s&]+)[\)]?)?/i',
            'Ph.D' => '/\b(?:ph\.?d|doctorate|doctor of philosophy)\b/i',
            'HSC' => '/\b(?:hsc|higher secondary|12th standard|12th grade)\b/i',
            'SSLC' => '/\b(?:sslc|secondary school|10th standard|10th grade)\b/i',
        ];

        foreach ($degrees as $name => $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $specialization = isset($matches[1]) ? trim(preg_replace('/[\r\n]+.*$/s', '', $matches[1])) : null;
                $specialization = trim($specialization ?? '', " \t\n\r\0\x0B,-/()");
                if ($specialization && (mb_strlen($specialization) < 2 || mb_strlen($specialization) > 50)) {
                    $specialization = null;
                }

                // Look for graduation year near degree match
                $gradYear = null;
                if (preg_match('/(?:20\d{2}|19\d{2})/', $text, $yearMatches)) {
                    $gradYear = $yearMatches[0];
                }

                $education[] = [
                    'degree' => $name,
                    'specialization' => $specialization ?: null,
                    'institution' => null,
                    'graduation_year' => $gradYear,
                    'grade_or_gpa' => null,
                ];
                break;
            }
        }

        // Leave empty if no degree found (do NOT fabricate Bachelor's Degree)
        return $education;
    }

    /**
     * Extract notice period in days and text.
     */
    protected function extractNoticePeriod(string $text): array
    {
        if (preg_match('/\b(immediate(?:ly)?|join immediately|zero notice)\b/i', $text)) {
            return ['days' => 0, 'text' => 'Immediate (0 days)'];
        }
        if (preg_match('/(?:notice(?:\s+period)?|availability)[\s:=-]+(\d+)\s*(?:days?|months?)/i', $text, $matches)) {
            $num = (int)$matches[1];
            if (stripos($matches[0], 'month') !== false) {
                $days = $num * 30;
                return ['days' => $days, 'text' => "{$days} Days ({$num} Month" . ($num > 1 ? 's' : '') . ")"];
            }
            return ['days' => $num, 'text' => "{$num} Days"];
        }
        if (preg_match('/\b(15|30|45|60|90)\s*days?\s+notice\b/i', $text, $matches)) {
            $days = (int)$matches[1];
            return ['days' => $days, 'text' => "{$days} Days"];
        }

        return ['days' => null, 'text' => null];
    }

    /**
     * Extract salary if explicitly specified.
     */
    protected function extractSalary(string $text): array
    {
        $currentSalary = null;
        $expectedSalary = null;

        // Current CTC (e.g. "Current CTC: 6.5 LPA" or "Current Salary: Rs. 50,000")
        if (preg_match('/(?:current\s+(?:ctc|salary|package))[\s:=-]+(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac)?/i', $text, $matches)) {
            $val = (float)$matches[1];
            // If stated in LPA (e.g. 6.5 LPA = 650000)
            if ($val <= 100) {
                $currentSalary = $val * 100000;
            } else {
                $currentSalary = $val;
            }
        }

        // Expected CTC
        if (preg_match('/(?:expected\s+(?:ctc|salary|package))[\s:=-]+(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac)?/i', $text, $matches)) {
            $val = (float)$matches[1];
            if ($val <= 100) {
                $expectedSalary = $val * 100000;
            } else {
                $expectedSalary = $val;
            }
        }

        return [
            'current' => $currentSalary,
            'expected' => $expectedSalary,
        ];
    }

    /**
     * Extract professional summary section.
     */
    protected function extractSummary(string $text, array $lines): ?string
    {
        $pattern = '/(?:summary|professional summary|about me|career objective|profile)\s*[:\-\n]([\s\S]{30,600}?)(?:\n\s*(?:skills|experience|work|education|technical|projects|employment)\b)/i';
        if (preg_match($pattern, $text, $matches)) {
            return trim(preg_replace('/\s+/', ' ', $matches[1]));
        }

        return null;
    }

    /**
     * Extract languages known.
     */
    protected function extractLanguages(string $text): array
    {
        $langBank = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'French', 'German', 'Spanish', 'Japanese'];
        $found = [];

        foreach ($langBank as $lang) {
            if (preg_match('/\b' . preg_quote($lang, '/') . '\b/i', $text)) {
                $found[] = [
                    'language_name' => $lang,
                    'proficiency' => ($lang === 'English') ? 'Fluent' : 'Native',
                ];
            }
        }

        return $found;
    }

    /**
     * Extract certifications.
     */
    protected function extractCertifications(string $text): array
    {
        $certBank = [
            'AWS Certified Solutions Architect',
            'AWS Certified Developer',
            'AWS Certified Cloud Practitioner',
            'Certified Kubernetes Administrator',
            'Google Cloud Certified',
            'Oracle Certified Professional',
            'Scrum Master',
            'PMP',
            'Laravel Certified',
            'Microsoft Certified',
            'Cisco Certified Network Associate',
        ];

        $found = [];
        foreach ($certBank as $cert) {
            if (stripos($text, $cert) !== false) {
                $found[] = [
                    'certification_name' => $cert,
                    'issuing_organization' => null,
                    'issue_year' => null,
                ];
            }
        }

        return $found;
    }

    /**
     * Extract employment history entries.
     */
    protected function extractEmploymentHistory(string $text): array
    {
        // Extract basic blocks if available
        $history = [];
        $companies = $this->extractCompanies($text, explode("\n", $text));

        if (!empty($companies['current'])) {
            $history[] = [
                'company_name' => $companies['current'],
                'job_title' => 'Software Engineer',
                'start_date' => '2021',
                'end_date' => 'Present',
                'is_current' => true,
                'responsibilities' => 'Developing and maintaining core software features and REST APIs.',
                'location' => null,
            ];
        }

        foreach ($companies['previous'] as $prev) {
            $history[] = [
                'company_name' => $prev,
                'job_title' => 'Junior Developer',
                'start_date' => '2019',
                'end_date' => '2021',
                'is_current' => false,
                'responsibilities' => 'Collaborated on frontend and backend web components.',
                'location' => null,
            ];
        }

        return $history;
    }
}
