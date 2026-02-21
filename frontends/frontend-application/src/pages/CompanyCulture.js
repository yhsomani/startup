import React, { useState, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Box, Typography, Button, Paper, TextField, Snackbar, Alert } from "@mui/material";
import axios from "axios";

// Video Player Component
const VideoPlayer = ({ options, onReady }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    React.useEffect(() => {
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered");
            videoRef.current.appendChild(videoElement);

            const player = (playerRef.current = videojs(videoElement, options, () => {
                videojs.log("player is ready");
                onReady && onReady(player);
            }));
        } else {
            const player = playerRef.current;
            player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options, onReady]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        const player = playerRef.current;
        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div data-vjs-player>
            <div ref={videoRef} />
        </div>
    );
};

const CompanyCulture = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null); // URL to m3u8
    const [message, setMessage] = useState({ type: "", text: "", open: false });

    const handleFileChange = e => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("video", file);

        setUploading(true);
        try {
            // Use environment-configured API URL
            const apiUrl = process.env.REACT_APP_API_URL || "/api";
            const response = await axios.post(`${apiUrl}/video/vod/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setMessage({
                    type: "success",
                    text: "Upload successful! Processing started.",
                    open: true,
                });
                // Set stream URL (In real app, wait for processing or poll status)
                // For demo, we presume instantaneous or pre-existing for playback,
                // but normally we need to wait for ffmpeg.
                // setVideoUrl(`${apiUrl}/video${response.data.streamUrl}`);
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Upload failed", open: true });
        } finally {
            setUploading(false);
        }
    };

    const playerOptions = {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
            {
                src: videoUrl,
                type: "application/x-mpegURL",
            },
        ],
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Company Culture Videos
            </Typography>

            {/* Upload Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Upload New Video
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                        type="file"
                        onChange={handleFileChange}
                        inputProps={{ accept: "video/*" }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={!file || uploading}>
                        {uploading ? "Uploading..." : "Upload Video"}
                    </Button>
                </Box>
            </Paper>

            {/* Player Section */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Preview Player
                </Typography>
                {videoUrl ? (
                    <VideoPlayer options={playerOptions} />
                ) : (
                    <Typography color="text.secondary">
                        Upload a video to see the preview (Demo Mode)
                    </Typography>
                )}
            </Paper>

            <Snackbar
                open={message.open}
                autoHideDuration={6000}
                onClose={() => setMessage({ ...message, open: false })}>
                <Alert severity={message.type === "error" ? "error" : "success"}>
                    {message.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CompanyCulture;
