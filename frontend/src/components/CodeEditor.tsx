import React from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  onLanguageChange?: (language: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, onLanguageChange }) => {
	const { resolvedTheme } = useTheme();
	const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

	const handleEditorChange = (value: string | undefined) => {
		if (onChange) onChange(value || "");
	};

	return (
		<div className="flex flex-col h-full w-full bg-card p-4 rounded-xl border border-border text-card-foreground shadow-sm transition-colors duration-200">
			<div className="flex justify-between items-center mb-3">
				<h2 className="text-foreground font-semibold text-base">Code Editor</h2>
				<select 
					value={language}
					onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
					className="bg-secondary text-secondary-foreground border border-border text-xs font-medium rounded-lg focus:ring-1 focus:ring-primary block px-3 py-1.5 cursor-pointer outline-none"
				>
					<option value="python">Python 3</option>
					<option value="cpp">C++ (GCC)</option>
				</select>
			</div>

			<div className="h-[680px] overflow-hidden border border-border rounded-lg">
				<Editor
					height="100%"
					language={language}
					theme={monacoTheme}
					value={code}
					onChange={handleEditorChange}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						wordWrap: 'on',
						scrollBeyondLastLine: false,
					}}
				/>
			</div>
		</div>
	);
};

export default CodeEditor;
