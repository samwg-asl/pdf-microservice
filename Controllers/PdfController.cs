using Microsoft.AspNetCore.Mvc;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using System.IO;
using System.Reflection;

namespace PdfMicroservice.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        // Throttler to limit concurrent Chrome tabs and maintain a low memory overhead
        private static readonly SemaphoreSlim Throttler = new SemaphoreSlim(3, 3);

        [HttpPost("render")]
        public async Task<IActionResult> RenderQuillToPdf([FromBody] string quillHtml)
        {
            await Throttler.WaitAsync();

            try
            {
                // Pull browser path from the Dockerfile's environment variable
                string exePath = Environment.GetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH") ?? "/usr/bin/chromium";

                var launchOptions = new LaunchOptions
                {
                    Headless = true,
                    ExecutablePath = exePath,
                    Args = new[] { 
                        "--no-sandbox", 
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage", // Directs shared memory to /tmp to prevent Docker crash
                        "--disable-gpu" 
                    }
                };

                using var browser = await Puppeteer.LaunchAsync(launchOptions);
                using var page = await browser.NewPageAsync();

                string integratedHtml = $@"
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <style>
                            body {{ 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                padding: 20mm; 
                                background-color: #ffffff; 
                            }}

                            .ql-container, .ql-editor {{
                                height: auto !important;        /* Overrides fixed pixel/viewport heights */
                                overflow: visible !important;    /* Allows text to spill onto page 2, 3, etc. */
                                position: static !important;    /* Removes absolute boundary constraints */
                            }}

                            /* 3. Ensure list items don't awkwardly split in half at the page edge */
                            .ql-editor li {{
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }}

                            .ql-editor ul, .ql-editor ol {{ list-style-type: none !important; padding-left: 0 !important; }}
                            .ql-editor li::marker {{ content: '' !important; display: none !important; }}

                            .ql-editor li[data-list] {{
                                position: relative !important;
                                padding-left: 24px !important;
                                line-height: 1.6;
                                margin-bottom: 4px;
                            }}

                            /* Unchecked Box */
                            .ql-editor li[data-list='unchecked'] > .ql-ui::before {{
                                content: '' !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 3px !important;
                                width: 16px !important;
                                height: 16px !important;
                                background-image: url('data:image/svg+xml;utf8,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 16 16""><rect x=""1.5"" y=""1.5"" width=""13"" height=""13"" rx=""2"" fill=""none"" stroke=""%23444444"" stroke-width=""1.5""/></svg>') !important;
                                background-size: contain !important;
                                background-repeat: no-repeat !important;
                            }}

                            /* Checked Box */
                            .ql-editor li[data-list='checked'] > .ql-ui::before {{
                                content: '' !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 3px !important;
                                width: 16px !important;
                                height: 16px !important;
                                background-image: url('data:image/svg+xml;utf8,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 16 16""><rect x=""1.5"" y=""1.5"" width=""13"" height=""13"" rx=""2"" fill=""%2306c"" stroke=""%2306c"" stroke-width=""1.5""/><path d=""M5 8.5 l2 2 l4 -4"" fill=""none"" stroke=""white"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""/></svg>') !important;
                                background-size: contain !important;
                                background-repeat: no-repeat !important;
                            }}

                            /* ─── FIXED TEXT NODE COLOR HANDLING ─── */
                            .ql-editor li[data-list='checked'] {{
                                color: #000000 !important;                /* Keeps text dark black */
                                text-decoration: none !important; /* Keeps strike-through line */
                            }}

                            @media print {{ 
                                body {{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }} 
                            }}
                        </style>
                    </head>
                    <body class='ql-snow'>
                        <div class='ql-container ql-snow' style='border: none !important;'>
                            <div class='ql-editor'>{quillHtml}</div>
                        </div>
                    </body>
                    </html>";

                await page.SetContentAsync(integratedHtml);

                string quillCssPath = Path.Combine(AppContext.BaseDirectory, "Assets", "quill.snow.css");
                await page.AddStyleTagAsync(new AddTagOptions { Path = quillCssPath });
                
                string katexCssPath = Path.Combine(AppContext.BaseDirectory, "Assets", "katex.min.css");
                await page.AddStyleTagAsync(new AddTagOptions { Path = katexCssPath });

                string kataxJsPath = Path.Combine(AppContext.BaseDirectory, "Assets", "katex.min.js");
                await page.AddScriptTagAsync(new AddTagOptions { Path = kataxJsPath });
                
                string checkboxCssPath = Path.Combine(AppContext.BaseDirectory, "Assets", "checkbox.css");
                await page.AddStyleTagAsync(new AddTagOptions { Path = checkboxCssPath });

                string renderScript = """
                    (() => {
                        document.querySelectorAll('.ql-formula').forEach(el => {
                            const formulaText = el.getAttribute('data-value');
                            if (formulaText && typeof katex !== 'undefined') {
                                try {
                                    katex.render(formulaText, el, {
                                        throwOnError: false,
                                        displayMode: false
                                    });
                                } catch (err) {
                                    console.error("Local Math rendering failure:", err);
                                }
                            }
                        });
                    })();
                    """;

                await page.EvaluateExpressionAsync(renderScript);

                // Block execution until web fonts and layout engine settle
                await page.EvaluateExpressionAsync("document.fonts.ready");

                var pdfOptions = new PdfOptions
                {
                    Format = PaperFormat.A4,
                    PrintBackground = true // Keeps Quill background colors and highlights
                };

                var pdfStream = await page.PdfStreamAsync(pdfOptions);

                
                return File(pdfStream, "application/pdf", "output.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal PDF Rendering Exception: {ex.Message}");
            }
            finally
            {
                Throttler.Release();
            }
        }
    }
}