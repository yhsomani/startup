import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { editor } from "monaco-editor";

interface CollaborativeEditorProps {
    roomId: string; // Creates a unique room per challenge/submission
    initialValue?: string;
    language?: string;
    theme?: string;
    userName?: string;
    onChange?: (value: string | undefined) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
    roomId,
    initialValue = "// Start coding...",
    language = "javascript",
    theme = "vs-dark",
    userName = "Anonymous",
    onChange,
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [status, setStatus] = useState<string>("Connecting...");

    useEffect(() => {
        // Cleanup function handles unmounting
        let provider: WebsocketProvider | null = null;
        let binding: MonacoBinding | null = null;
        let doc: Y.Doc | null = null;

        const initEditor = () => {
            if (!editorRef.current) return;

            // 1. Create Yjs Document
            doc = new Y.Doc();

            // 2. Connect to WebSocket (Collaboration Service)
            const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
            provider = new WebsocketProvider(`${WS_BASE}/ws/`, roomId, doc);

            // 3. Define Shared Text Type
            const type = doc.getText("monaco");

            // 4. Bind Yjs to Monaco
            binding = new MonacoBinding(
                type,
                editorRef.current.getModel()!,
                new Set([editorRef.current]),
                provider.awareness
            );

            // Set User status
            provider.awareness.setLocalStateField("user", {
                name: userName,
                color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Random color
            });

            provider.on("status", (event: { status: string }) => {
                setStatus(event.status); // 'connected' or 'disconnected'
            });
        };

        if (editorRef.current) {
            initEditor();
        }

        return () => {
            provider?.disconnect();
            doc?.destroy();
            binding?.destroy();
        };
    }, [roomId, userName]);

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
    };

    return (
        <div className="flex flex-col h-full">
            <div
                className={`text-xs px-2 py-1 ${status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                Status: {status} | Room: {roomId}
            </div>
            <div className="flex-1 min-h-[500px]">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    theme={theme}
                    defaultValue={initialValue}
                    onMount={handleEditorDidMount}
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
};
