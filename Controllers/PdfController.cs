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
                    </head>
                    <body>
                        <div class='ql-container ql-snow'>
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