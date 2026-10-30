<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateActivityLog;
use App\Models\Resume;
use App\Services\ResumeParserService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ResumeController extends Controller
{
    protected ResumeParserService $parserService;

    public function __construct(ResumeParserService $parserService)
    {
        $this->parserService = $parserService;
    }

    /**
     * Display a filtered list of uploaded resumes with pagination, search, and summary.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Resume::query()->with([
                'candidate:id,full_name,email,phone,primary_role,candidate_status',
                'uploader:id,name,email',
            ]);

            // Search by filename or candidate info
            if ($search = trim($request->input('search', ''))) {
                $query->where(function ($q) use ($search) {
                    $q->where('original_filename', 'like', "%{$search}%")
                      ->orWhere('stored_filename', 'like', "%{$search}%")
                      ->orWhereHas('candidate', function ($cq) use ($search) {
                          $cq->where('full_name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%")
                             ->orWhere('phone', 'like', "%{$search}%");
                      });
                });
            }

            // Filter by format (.pdf, .docx, .doc)
            if ($format = trim($request->input('format', ''))) {
                $ext = strtolower(ltrim($format, '.'));
                $query->where('original_filename', 'like', "%.{$ext}");
            }

            // Filter by status (success, partial, failed)
            if ($status = trim($request->input('status', ''))) {
                $query->where('parsing_status', $status);
            }

            // Filter by linkage (linked, unlinked)
            if ($linkage = trim($request->input('linkage', ''))) {
                if ($linkage === 'linked') {
                    $query->whereNotNull('candidate_id');
                } elseif ($linkage === 'unlinked') {
                    $query->whereNull('candidate_id');
                }
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = strtolower($request->input('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $allowedSorts = ['created_at', 'original_filename', 'file_size', 'parsing_status'];

            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $perPage = min(100, max(5, (int)$request->input('per_page', 15)));
            $resumes = $query->paginate($perPage);

            // Compute summary metrics directly from database
            $totalResumes = Resume::count();
            $linkedResumes = Resume::whereNotNull('candidate_id')->count();
            $unlinkedResumes = Resume::whereNull('candidate_id')->count();
            $pdfCount = Resume::where('original_filename', 'like', '%.pdf')->count();
            $docxCount = Resume::where(function ($q) {
                $q->where('original_filename', 'like', '%.docx')
                  ->orWhere('original_filename', 'like', '%.doc');
            })->count();

            return response()->json([
                'success' => true,
                'data' => $resumes,
                'summary' => [
                    'total_resumes' => $totalResumes,
                    'linked_resumes' => $linkedResumes,
                    'unlinked_resumes' => $unlinkedResumes,
                    'pdf_count' => $pdfCount,
                    'docx_count' => $docxCount,
                ],
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR)
              ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache');
        } catch (\Throwable $e) {
            Log::error('Resume index error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load resumes: ' . $e->getMessage(),
            ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }
    }

    /**
     * Upload and parse a single resume file.
     */
    public function uploadAndParse(Request $request): JsonResponse
    {
        // Check if file was sent or if PHP dropped it due to server upload limits
        if (!$request->hasFile('resume')) {
            $maxPost = ini_get('post_max_size');
            $maxUpload = ini_get('upload_max_filesize');
            return response()->json([
                'success' => false,
                'message' => "No resume file received. The file may exceed the server upload limit (post_max_size: {$maxPost}, upload_max_filesize: {$maxUpload}).",
            ], 422);
        }

        $file = $request->file('resume');

        if (!$file->isValid()) {
            $errMsg = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE => "File exceeds server limit (upload_max_filesize: " . ini_get('upload_max_filesize') . ").",
                UPLOAD_ERR_FORM_SIZE => "File exceeds form size limit.",
                UPLOAD_ERR_PARTIAL => "File was only partially uploaded.",
                UPLOAD_ERR_NO_FILE => "No file was uploaded.",
                UPLOAD_ERR_NO_TMP_DIR => "Server temporary directory is missing.",
                UPLOAD_ERR_CANT_WRITE => "Server failed to write file to disk. Check storage folder permissions.",
                UPLOAD_ERR_EXTENSION => "A PHP extension stopped the file upload.",
                default => "File upload failed with error code: " . $file->getError(),
            };
            return response()->json(['success' => false, 'message' => $errMsg], 422);
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, ['pdf', 'docx', 'doc'])) {
            return response()->json([
                'success' => false,
                'message' => "Unsupported file format (.{$extension}). Please upload PDF or DOCX format.",
            ], 422);
        }

        if ($file->getSize() > 15 * 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => "Resume file exceeds 15MB size limit.",
            ], 422);
        }

        $userId = $request->user()?->id;

        try {
            $parsed = $this->parserService->processUpload($file, $userId);

            // Check if exact file hash was already uploaded
            $existingResume = Resume::with('candidate')->where('file_hash', $parsed['file_hash'])->first();

            // Save Resume record in storage
            $resume = Resume::create([
                'candidate_id' => null, // will be linked on candidate review save
                'original_filename' => $parsed['original_filename'],
                'stored_filename' => $parsed['stored_filename'],
                'file_path' => $parsed['file_path'],
                'file_mime' => $parsed['file_mime'],
                'file_size' => $parsed['file_size'],
                'file_hash' => $parsed['file_hash'],
                'parsing_status' => $parsed['parsing_status'],
                'parsing_error' => $parsed['parsing_error'],
                'text_content' => $parsed['raw_text'],
                'extracted_json' => $parsed['extracted_data'],
                'uploaded_by' => $userId,
            ]);

            try {
                CandidateActivityLog::log(
                    null,
                    $userId,
                    'resume_uploaded',
                    "Resume {$parsed['original_filename']} uploaded and parsed."
                );
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => 'Resume uploaded and parsed successfully.',
                'data' => [
                    'resume_id' => $resume->id,
                    'file_name' => $parsed['original_filename'],
                    'file_size' => $parsed['file_size'],
                    'file_hash' => $parsed['file_hash'],
                    'is_duplicate' => (bool)$existingResume,
                    'existing_candidate' => $existingResume?->candidate,
                    'parsing_status' => $parsed['parsing_status'],
                    'parsing_error' => $parsed['parsing_error'],
                    'ocr_needed' => $parsed['ocr_needed'],
                    'extracted_data' => $parsed['extracted_data'],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resume processing failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk upload resumes with independent processing per file.
     */
    public function bulkUploadAndParse(Request $request): JsonResponse
    {
        if (!$request->hasFile('resumes')) {
            $maxPost = ini_get('post_max_size');
            return response()->json([
                'success' => false,
                'message' => "No resumes received. Total batch size may exceed server limit (post_max_size: {$maxPost}).",
            ], 422);
        }

        $files = $request->file('resumes');
        if (!is_array($files) || count($files) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Please select at least one resume file to upload.',
            ], 422);
        }

        $userId = $request->user()?->id;
        $results = [];
        $successCount = 0;
        $failedCount = 0;

        foreach ($files as $file) {
            $origName = $file->getClientOriginalName();

            if (!$file->isValid()) {
                $results[] = [
                    'file_name' => $origName,
                    'status' => 'failed',
                    'error' => "Upload error (code: " . $file->getError() . ")",
                ];
                $failedCount++;
                continue;
            }

            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, ['pdf', 'docx', 'doc'])) {
                $results[] = [
                    'file_name' => $origName,
                    'status' => 'failed',
                    'error' => "Unsupported format (.{$ext}). Only PDF or DOCX allowed.",
                ];
                $failedCount++;
                continue;
            }

            try {
                $parsed = $this->parserService->processUpload($file, $userId);

                $existingResume = Resume::with('candidate')->where('file_hash', $parsed['file_hash'])->first();

                $resume = Resume::create([
                    'candidate_id' => null,
                    'original_filename' => $parsed['original_filename'],
                    'stored_filename' => $parsed['stored_filename'],
                    'file_path' => $parsed['file_path'],
                    'file_mime' => $parsed['file_mime'],
                    'file_size' => $parsed['file_size'],
                    'file_hash' => $parsed['file_hash'],
                    'parsing_status' => $parsed['parsing_status'],
                    'parsing_error' => $parsed['parsing_error'],
                    'text_content' => $parsed['raw_text'],
                    'extracted_json' => $parsed['extracted_data'],
                    'uploaded_by' => $userId,
                ]);

                $results[] = [
                    'file_name' => $origName,
                    'status' => 'success',
                    'resume_id' => $resume->id,
                    'is_duplicate' => (bool)$existingResume,
                    'existing_candidate' => $existingResume?->candidate,
                    'ocr_needed' => $parsed['ocr_needed'],
                    'extracted_data' => $parsed['extracted_data'],
                ];
                $successCount++;
            } catch (\Throwable $e) {
                $results[] = [
                    'file_name' => $origName,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
                $failedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total' => count($files),
                'successful' => $successCount,
                'failed' => $failedCount,
            ],
            'items' => $results,
        ]);
    }

    /**
     * Locate the physical file path of a resume across possible storage disks and root folders.
     */
    public function getResumeFullPath(Resume $resume): ?string
    {
        $filePath = $resume->file_path;
        if (empty($filePath)) {
            if (!empty($resume->stored_filename)) {
                $filePath = 'resumes/' . $resume->stored_filename;
            } else {
                return null;
            }
        }

        // Direct check if it's already an existing absolute path
        if (file_exists($filePath) && is_file($filePath)) {
            return $filePath;
        }

        // 1. Direct check on Storage 'local' disk (storage/app/private in Laravel 11/12)
        try {
            if (Storage::disk('local')->exists($filePath)) {
                return Storage::disk('local')->path($filePath);
            }
        } catch (\Throwable $e) {}

        // 2. Direct check on Storage 'public' disk
        try {
            if (Storage::disk('public')->exists($filePath)) {
                return Storage::disk('public')->path($filePath);
            }
        } catch (\Throwable $e) {}

        // 3. Normalized relative path checks
        $cleanPath = ltrim(str_replace('\\', '/', $filePath), '/');

        // Check storage/app/private/...
        $privatePath = storage_path('app/private/' . $cleanPath);
        if (file_exists($privatePath) && is_file($privatePath)) {
            return $privatePath;
        }

        // Check storage/app/... (Laravel 10 compatibility)
        $appPath = storage_path('app/' . $cleanPath);
        if (file_exists($appPath) && is_file($appPath)) {
            return $appPath;
        }

        // Check storage/app/public/...
        $publicPath = storage_path('app/public/' . $cleanPath);
        if (file_exists($publicPath) && is_file($publicPath)) {
            return $publicPath;
        }

        // Check public/storage/...
        $webStorage = public_path('storage/' . $cleanPath);
        if (file_exists($webStorage) && is_file($webStorage)) {
            return $webStorage;
        }

        // 4. By stored_filename if different
        if (!empty($resume->stored_filename)) {
            $byStored = 'resumes/' . $resume->stored_filename;
            $candidates = [
                storage_path('app/private/' . $byStored),
                storage_path('app/' . $byStored),
                storage_path('app/public/' . $byStored),
                public_path('storage/' . $byStored),
            ];
            foreach ($candidates as $cand) {
                if (file_exists($cand) && is_file($cand)) {
                    return $cand;
                }
            }
        }

        return null;
    }

    /**
     * Securely download resume file from private storage.
     */
    public function download(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        $resume = Resume::findOrFail($id);

        $fullPath = $this->getResumeFullPath($resume);

        if (!$fullPath || !file_exists($fullPath)) {
            // Fallback: If physical file was removed but text_content is preserved, download as text
            if (!empty($resume->text_content)) {
                $baseName = pathinfo($resume->original_filename ?: 'resume', PATHINFO_FILENAME);
                return response($resume->text_content, 200, [
                    'Content-Type' => 'text/plain; charset=UTF-8',
                    'Content-Disposition' => 'attachment; filename="' . addslashes($baseName) . '.txt"',
                    'Access-Control-Expose-Headers' => 'Content-Disposition',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Resume file not found on storage server.'
            ], 404);
        }

        CandidateActivityLog::log(
            $resume->candidate_id,
            $request->user()?->id,
            'resume_downloaded',
            "Downloaded resume file: {$resume->original_filename}"
        );

        $downloadFilename = $resume->original_filename ?: basename($fullPath);

        return response()->download($fullPath, $downloadFilename, [
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }

    /**
     * Preview resume inline (e.g. for browser iframe/PDF viewer).
     */
    public function preview(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        $resume = Resume::findOrFail($id);

        $fullPath = $this->getResumeFullPath($resume);

        if (!$fullPath || !file_exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Resume file not found on storage server.',
                'resume' => [
                    'id' => $resume->id,
                    'original_filename' => $resume->original_filename,
                    'has_text' => !empty($resume->text_content),
                    'text_content' => $resume->text_content,
                    'extracted_json' => $resume->extracted_json,
                ]
            ], 404);
        }

        $ext = strtolower(pathinfo($resume->original_filename, PATHINFO_EXTENSION));
        $mime = $resume->file_mime ?: match ($ext) {
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt' => 'text/plain',
            default => mime_content_type($fullPath) ?: 'application/octet-stream',
        };

        if ($ext === 'pdf') {
            $mime = 'application/pdf';
        }

        return response()->file($fullPath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . addslashes($resume->original_filename) . '"',
            'Cache-Control' => 'no-cache, private',
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }

    /**
     * Retry extraction on an existing resume.
     */
    public function retryExtraction(Request $request, int $id): JsonResponse
    {
        $resume = Resume::findOrFail($id);

        $fullPath = $this->getResumeFullPath($resume);

        if (!$fullPath || !file_exists($fullPath)) {
            return response()->json(['message' => 'Resume file not found on storage server.'], 404);
        }

        $ext = strtolower(pathinfo($resume->original_filename, PATHINFO_EXTENSION));

        try {
            $rawText = '';
            if ($ext === 'pdf') {
                $rawText = $this->parserService->extractTextFromPdf($fullPath);
            } elseif ($ext === 'docx') {
                $rawText = $this->parserService->extractTextFromDocx($fullPath);
            } elseif ($ext === 'doc') {
                $rawText = $this->parserService->extractTextFromDoc($fullPath);
            }

            $extracted = $this->parserService->parseResumeText($rawText, $resume->original_filename);

            $status = mb_strlen(trim($rawText)) < 30 ? 'partial' : 'success';
            $error = $status === 'partial' ? 'The document contains minimal extractable text.' : null;

            $resume->update([
                'text_content' => $rawText,
                'extracted_json' => $extracted,
                'parsing_status' => $status,
                'parsing_error' => $error,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Resume re-extracted successfully.',
                'data' => [
                    'resume_id' => $resume->id,
                    'extracted_data' => $extracted,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Extraction retry failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show resume details with raw text and parsed extracted data.
     */
    public function show(int $id): JsonResponse
    {
        $resume = Resume::with(['candidate', 'uploader'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $resume,
        ]);
    }

    /**
     * Delete resume record and remove file from storage.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $resume = Resume::findOrFail($id);

        // Delete physical file safely
        try {
            $fullPath = $this->getResumeFullPath($resume);
            if ($fullPath && file_exists($fullPath)) {
                @unlink($fullPath);
            }
            if ($resume->file_path && Storage::disk('local')->exists($resume->file_path)) {
                Storage::disk('local')->delete($resume->file_path);
            }
        } catch (\Throwable $e) {}

        $filename = $resume->original_filename;
        $candidateId = $resume->candidate_id;

        $resume->delete();

        try {
            CandidateActivityLog::log(
                $candidateId,
                $request->user()?->id,
                'resume_deleted',
                "Deleted resume file: {$filename}"
            );
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => "Resume file '{$filename}' deleted successfully.",
        ]);
    }
}
