#!/usr/bin/env python3
import re
import sys
import os
from pathlib import Path

def fix_error_handling(content):
    """Fix catch (error) blocks to handle unknown type"""
    pattern = r'catch \(error\) \{([^\}]*?)this\.logger\.error\([^,]+,\s*error\.message[^\)]*\),\s*error\.stack'
    
    def replace_error(match):
        body = match.group(1)
        return f'''catch (error) {{
      const err = error instanceof Error ? error : new Error(String(error));{body}this.logger.error(... err.message ...), err.stack'''
    
    return content

def fix_class_properties(content):
    """Add ! to uninitialized class properties with decorators"""
    lines = content.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        # Check if line has a decorator
        if i > 0 and lines[i-1].strip().startswith('@'):
            # Add ! to property if it doesn't have it and doesn't have initializer
            if ':' in line and '=' not in line and '!' not in line:
                line = line.replace(':', '!:', 1)
        result.append(line)
    
    return '\n'.join(result)

def main():
    base_path = Path('/c/Users/grube/op/operate-fresh/apps/api/src')
    
    for ts_file in base_path.rglob('*.ts'):
        if 'node_modules' in str(ts_file):
            continue
            
        try:
            with open(ts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            # content = fix_error_handling(content)
            # content = fix_class_properties(content)
            
            if content != original:
                with open(ts_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed: {ts_file}")
        except Exception as e:
            print(f"Error processing {ts_file}: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
