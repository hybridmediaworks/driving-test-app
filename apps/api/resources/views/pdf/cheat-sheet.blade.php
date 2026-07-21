<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $cheatSheet->title }}</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 12px;
            line-height: 1.5;
        }
        h1 {
            font-size: 22px;
            margin-bottom: 4px;
        }
        .summary {
            color: #555555;
            font-size: 13px;
            margin-bottom: 24px;
        }
        h2.section-heading {
            font-size: 15px;
            margin-top: 22px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #cccccc;
        }
        .section-body ul, .section-body ol {
            margin: 0 0 10px 18px;
            padding: 0;
        }
        .section-body p {
            margin: 0 0 10px 0;
        }
        .footer {
            margin-top: 32px;
            font-size: 9px;
            color: #999999;
        }
    </style>
</head>
<body>
    <h1>{{ $cheatSheet->title }}</h1>
    <p class="summary">{{ $cheatSheet->summary }}</p>

    @foreach ($sections as $section)
        <h2 class="section-heading">{{ $section['heading'] }}</h2>
        <div class="section-body">
            {!! $section['html'] !!}
        </div>
    @endforeach

    <p class="footer">Generated for study purposes. Always verify against your state's official driver handbook.</p>
</body>
</html>
