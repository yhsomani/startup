import React from 'react';

interface EditorMockProps {
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    [key: string]: unknown;
}

const EditorMock = (props: EditorMockProps) => {
    return (
        <textarea
            data-testid="monaco-editor"
            defaultValue={props.defaultValue || props.value}
            onChange={(e) => props.onChange?.(e.target.value)}
        />
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const editor = {
    IStandaloneCodeEditor: {}
};

export const Editor = EditorMock;
export default EditorMock;
