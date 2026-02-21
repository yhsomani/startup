#!/usr/bin/env python3
"""
Quick script to fix common Python linting issues
"""
import os
import re
from pathlib import Path

def fix_whitespace_issues(file_path):
    """Fix whitespace issues in Python files"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix trailing whitespace
    lines = content.splitlines()
    fixed_lines = []
    
    for line in lines:
        # Remove trailing whitespace
        line = line.rstrip()
        fixed_lines.append(line)
    
    # Ensure file ends with newline
    content = '\n'.join(fixed_lines) + '\n'
    
    # Fix multiple consecutive blank lines (more than 2)
    content = re.sub(r'\n{3,}', '\n\n\n', content)
    
    # Fix missing blank lines after imports and function definitions
    lines = content.splitlines()
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        result.append(line)
        
        # Check if this is an import line
        if (line.strip().startswith('import ') or 
            line.strip().startswith('from ')) and i + 1 < len(lines):
            next_line = lines[i + 1]
            if next_line.strip() and not (next_line.strip().startswith('import ') or 
                                          next_line.strip().startswith('from ') or
                                          next_line.strip().startswith('#')):
                # Add blank line after imports if needed
                if result[-2].strip().startswith(('import ', 'from ')):
                    result.insert(-1, '')
                    i += 1
                    continue
        
        i += 1
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(result) + '\n')

def main():
    """Main script to fix Python files"""
    backend_path = Path(__file__).parent / "backends" / "backend-flask" / "app"
    
    python_files = list(backend_path.rglob("*.py"))
    
    for file_path in python_files:
        try:
            fix_whitespace_issues(file_path)
            print(f"Fixed {file_path}")
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")

if __name__ == "__main__":
    main()