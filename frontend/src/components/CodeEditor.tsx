import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  onLanguageChange?: (language: string) => void;
  hideHeader?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onLanguageChange,
  hideHeader = false
}) => {
  const monacoLanguage = language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : language === 'java' ? 'java' : 'python';

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) onChange(value || '');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white overflow-hidden">
      {!hideHeader && (
        <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-[#333333]">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
            Solution Editor
          </span>
          <select
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="bg-[#1e1e1e] text-gray-200 border border-[#444444] text-xs font-medium rounded px-2.5 py-1 focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="java">Java (OpenJDK)</option>
          </select>
        </div>
      )}

      <div className="flex-1 w-full min-h-0 relative">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            suggestOnTriggerCharacters: true
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
