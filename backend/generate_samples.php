<?php

// Script to generate test sample resumes in PDF and DOCX formats

$outputDir = __DIR__ . '/../sample_resumes';
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0777, true);
}

// 1. Generate Karthika_Devi_Laravel_Developer.pdf
$pdfText = <<<EOT
Karthika Devi R
Email: karthika.devi@example.com
Phone: +91 98412 34567
Location: Chennai, Tamil Nadu
LinkedIn: https://linkedin.com/in/karthika-devi-dev
GitHub: https://github.com/karthika-devi

PROFESSIONAL SUMMARY
Dynamic Laravel Developer with 3.8 years of extensive experience building enterprise web applications, RESTful APIs, and database solutions using PHP, Laravel, MySQL, and Vue.js.

TECHNICAL SKILLS
Backend: PHP, Laravel, REST API, Node.js, Python
Database: MySQL, PostgreSQL, Redis
Frontend: JavaScript, Vue.js, HTML5, CSS3, Bootstrap, Tailwind CSS
Tools & Cloud: Git, GitHub, Docker, AWS, Postman, Linux

WORK EXPERIENCE
Senior Software Engineer
Cognizant Infotech Pvt Ltd, Chennai
June 2022 - Present
- Architected and deployed microservices in Laravel 10 handling over 100k daily transactions.
- Designed relational database schemas in MySQL with optimized indexing and foreign key constraints.

PHP Web Developer
Synergy Systems, Coimbatore
August 2020 - May 2022
- Developed scalable customer relationship portals and integrated RESTful endpoints.

EDUCATION
B.E. in Computer Science and Engineering
Anna University, Chennai (2016 - 2020)

ADDITIONAL DETAILS
Notice Period: 30 Days Notice
Current CTC: 6.5 LPA
Expected CTC: 9.5 LPA
Languages: English, Tamil
EOT;

function createSimplePdf($filename, $text) {
    // Generate valid raw PDF 1.4
    $lines = explode("\n", $text);
    $streamContent = "BT\n/F1 11 Tf\n14 TL\n50 780 Td\n";
    foreach ($lines as $line) {
        $safeLine = str_replace(['(', ')', '\\'], ['\\(', '\\)', '\\\\'], $line);
        $streamContent .= "({$safeLine}) '\n";
    }
    $streamContent .= "ET";

    $streamLen = strlen($streamContent);

    $pdf = "%PDF-1.4\n";
    $offsets = [];

    $offsets[1] = strlen($pdf);
    $pdf .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

    $offsets[2] = strlen($pdf);
    $pdf .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

    $offsets[3] = strlen($pdf);
    $pdf .= "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

    $offsets[4] = strlen($pdf);
    $pdf .= "4 0 obj\n<< /Length {$streamLen} >>\nstream\n{$streamContent}\nendstream\nendobj\n";

    $offsets[5] = strlen($pdf);
    $pdf .= "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

    $xrefOffset = strlen($pdf);
    $pdf .= "xref\n0 6\n0000000000 65535 f \n";
    for ($i = 1; $i <= 5; $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }

    $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

    file_put_contents($filename, $pdf);
}

createSimplePdf($outputDir . '/Karthika_Devi_Laravel_Developer.pdf', $pdfText);
echo "Created: {$outputDir}/Karthika_Devi_Laravel_Developer.pdf\n";

// 2. Generate Arun_Prakash_React_Developer.docx using ZipArchive
$docxPath = $outputDir . '/Arun_Prakash_React_Developer.docx';
$zip = new ZipArchive();
if ($zip->open($docxPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
    // [Content_Types].xml
    $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>';
    $zip->addFromString('[Content_Types].xml', $contentTypes);

    // _rels/.rels
    $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>';
    $zip->addFromString('_rels/.rels', $rels);

    // word/document.xml
    $docxBody = 'Arun Prakash
Email: arun.prakash.frontend@example.com
Phone: +91 94421 98765
Location: Coimbatore, Tamil Nadu
GitHub: https://github.com/arun-prakash
LinkedIn: https://linkedin.com/in/arun-prakash-ui

PROFESSIONAL SUMMARY
Results-driven React Developer with 2.5 years of industry experience crafting responsive, accessible user interfaces using React, TypeScript, Redux Toolkit, and Tailwind CSS.

TECHNICAL SKILLS
Frontend: React, JavaScript, TypeScript, Next.js, Redux, HTML5, CSS3, Tailwind CSS, Bootstrap
Backend & APIs: Node.js, Express.js, RESTful APIs
Database & Tools: MongoDB, Git, GitHub, Vite, Figma

PROFESSIONAL EXPERIENCE
Frontend Developer
TechVanguard Solutions, Coimbatore
Jan 2022 - Present
- Built multi-tenant analytics dashboards utilizing React, TypeScript, and Tailwind.
- Implemented client-side caching and state management with Redux Toolkit.

EDUCATION
B.Sc in Computer Science
PSG College of Arts and Science, Coimbatore (2018 - 2021)

NOTICE PERIOD & COMPENSATION
Notice Period: 15 Days
Current CTC: 4.8 LPA
Expected CTC: 7.2 LPA
Availability: Immediate upon offer';

    $linesDocx = explode("\n", $docxBody);
    $xmlParagraphs = '';
    foreach ($linesDocx as $line) {
        $clean = htmlspecialchars(trim($line), ENT_XML1);
        $xmlParagraphs .= "<w:p><w:r><w:t>{$clean}</w:t></w:r></w:p>";
    }

    $docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>' . $xmlParagraphs . '</w:body>
    </w:document>';

    $zip->addFromString('word/document.xml', $docXml);
    $zip->close();
    echo "Created: {$docxPath}\n";
}
