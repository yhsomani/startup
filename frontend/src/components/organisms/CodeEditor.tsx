import React, { Suspense, lazy } from 'react';
import { cn } from '../../utils/cn';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export interface CodeEditorProps {
    language?: string;
    value: string;
    onChange?: (code: string) => void;
    readOnly?: boolean;
    theme?: 'vs-dark' | 'light';
    height?: string;
    className?: string;
}

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'rust', 'go'];

export const CodeEditor: React.FC<CodeEditorProps> = ({
    language = 'javascript',
    value,
    onChange,
    readOnly = false,
    theme = 'vs-dark',
    height = '400px',
    className,
}) => {
    return (
        <div className={cn('overflow-hidden bg-[#0d0a14]', className)}>
            <Suspense
                fallback={
                    <div
                        style={{ height }}
                        className="bg-[#0a070d] flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="w-16 h-16 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.3em] italic animate-pulse">Initializing IDE_</span>
                            <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest italic">NEURAL_SYNC_ACTUALIZING</span>
                        </div>
                    </div>
                }
            >
                <div className="relative group h-full">
                    {/* Minimalist Editor Overlay for Cinematic Feel */}
                    <div className="absolute top-0 right-0 p-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5 text-[9px] font-black text-[var(--color-secondary)] uppercase italic tracking-widest shadow-2xl">
                            Live Matrix Sync
                        </div>
                    </div>
                    
                    <MonacoEditor
                        height={height}
                        language={language}
                        value={value}
                        theme={theme}
                        options={{
                            readOnly,
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineHeight: 24,
                            tabSize: 2,
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            padding: { top: 20, bottom: 20 },
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            cursorSmoothCaretAnimation: 'on',
                            cursorBlinking: 'expand',
                            smoothScrolling: true,
                            automaticLayout: true,
                            scrollbar: { 
                                verticalScrollbarSize: 4, 
                                horizontalScrollbarSize: 4,
                                useShadows: false,
                                verticalHasArrows: false,
                                horizontalHasArrows: false
                            },
                            renderLineHighlight: 'all',
                            lineNumbersMinChars: 3,
                            glyphMargin: false,
                            overviewRulerBorder: false,
                            hideCursorInOverviewRuler: true,
                        }}
                        onChange={(v) => onChange?.(v ?? '')}
                    />
                </div>
            </Suspense>
        </div>
    );
};

export { SUPPORTED_LANGUAGES };
