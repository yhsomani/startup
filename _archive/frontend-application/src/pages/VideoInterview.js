import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { Box, Button, Typography, Paper, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';

const VideoInterview = () => {
    const { roomId } = useParams();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [isCaller, setIsCaller] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [me, setMe] = useState('');
    const [idToCall, setIdToCall] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const socket = useRef();

    useEffect(() => {
        // Connect to Video Service Signaling Server
        socket.current = io('http://localhost:3011'); // Ensure this matches API Gateway/Service URL

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            });

        socket.current.on('me', (id) => setMe(id));

        socket.current.on('calluser', ({ from, name: callerName, signal }) => {
            setCallAccepted(true);
            const peer = new SimplePeer({ initiator: false, trickle: false, stream: stream });

            peer.on('signal', (data) => {
                socket.current.emit('answercall', { signal: data, to: from });
            });

            peer.on('stream', (currentStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                }
            });

            peer.signal(signal);
            connectionRef.current = peer;
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const callUser = (id) => {
        const peer = new SimplePeer({ initiator: true, trickle: false, stream: stream });

        peer.on('signal', (data) => {
            socket.current.emit('calluser', { userToCall: id, signalData: data, from: me, name });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
            }
        });

        socket.current.on('callaccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        // window.location.reload();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Video Interview Room: {roomId}</Typography>

            <Grid container spacing={2} justifyContent="center">
                {/* My Video */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 1 }}>
                        <Typography variant="subtitle1">Me</Typography>
                        {stream && (
                            <video playsInline muted ref={myVideo} autoPlay style={{ width: '100%' }} />
                        )}
                    </Paper>
                </Grid>

                {/* User Video */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 1 }}>
                        <Typography variant="subtitle1">Candidate / Interviewer</Typography>
                        {callAccepted && !callEnded ? (
                            <video playsInline ref={userVideo} autoPlay style={{ width: '100%' }} />
                        ) : (
                            <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
                                <Typography>Waiting for connection...</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {!callAccepted && (
                    <Button variant="contained" color="primary" onClick={() => callUser(idToCall)}>
                        Call (Mock ID)
                    </Button>
                )}
                {callAccepted && !callEnded && (
                    <Button variant="contained" color="secondary" onClick={leaveCall}>
                        End Call
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default VideoInterview;
