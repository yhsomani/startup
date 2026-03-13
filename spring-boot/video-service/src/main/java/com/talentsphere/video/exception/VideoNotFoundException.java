package com.talentsphere.video.exception;

import java.util.UUID;

public class VideoNotFoundException extends RuntimeException {

    public VideoNotFoundException(UUID id) {
        super("Video not found with id: " + id);
    }

    public VideoNotFoundException(String message) {
        super(message);
    }
}
