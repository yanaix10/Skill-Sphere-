import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  onLanguageChange?: (language: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, onLanguageChange }) => {
	const handleEditorChange = (value: string | undefined) => {
		if (onChange) onChange(value || "");
	};

	return (
		<div className="flex flex-col h-full w-full bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
			<div className="flex justify-between items-center mb-3">
				<h2 className="text-white font-semibold text-lg">Code Editor</h2>
				<select 
					value={language}
					onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
					className="bg-gray-800 text-gray-300 border border-gray-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer outline-none"
				>
					<option value="python">Python 3</option>
					<option value="cpp">C++ (GCC)</option>
				</select>
			</div>

			<div className="h-[680px] overflow-hidden border border-gray-700">
				<Editor
					height="100%"
					language={language}
					theme="vs-dark"
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
