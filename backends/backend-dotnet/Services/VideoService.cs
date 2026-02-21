using System.Diagnostics;

namespace TalentSphere.API.Services
{
    public class VideoService
    {
        private readonly ILogger<VideoService> _logger;
        private readonly string _videoStoragePath;

        public VideoService(ILogger<VideoService> logger, IWebHostEnvironment env)
        {
            _logger = logger;
            _videoStoragePath = Path.Combine(env.WebRootPath ?? "wwwroot", "videos");
            Directory.CreateDirectory(_videoStoragePath);
        }

        public async Task<string> ProcessVideoAsync(Stream videoStream, Guid lessonId)
        {
            var lessonDir = Path.Combine(_videoStoragePath, lessonId.ToString());
            Directory.CreateDirectory(lessonDir);

            var inputPath = Path.Combine(lessonDir, "input.mp4");
            var outputPath = Path.Combine(lessonDir, "master.m3u8");

            // Save input file
            using (var fileStream = new FileStream(inputPath, FileMode.Create))
            {
                await videoStream.CopyToAsync(fileStream);
            }

            // Run ffmpeg
            // Command to transcode to HLS:
            // ffmpeg -i input.mp4 -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls master.m3u8
            // This is a simple copy-codec version for speed. For adaptive bitrate, we'd need re-encoding.
            
            var startInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-i \"{inputPath}\" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename \"{lessonDir}/segment%03d.ts\" \"{outputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = new Process { StartInfo = startInfo })
            {
                process.Start();
                string stderr = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    _logger.LogError($"FFmpeg failed: {stderr}");
                    throw new Exception("Video processing failed");
                }
            }

            // Return relative path for serving
            return $"/videos/{lessonId}/master.m3u8";
        }
    }
}
