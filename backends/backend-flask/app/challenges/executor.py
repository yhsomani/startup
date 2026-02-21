import subprocess
import os
import tempfile
import time
import json

class CodeExecutor:
    """
    Executes code in a subprocess with resource limits (timeout).
    """
    def __init__(self, timeout=5):
        self.timeout = timeout

    def execute_python(self, code, inputs=None):
        """
        Executes Python code.
        """
        # Security: Simple check for forbidden modules
        forbidden = ['os', 'sys', 'subprocess', 'requests', 'shutil', 'socket']
        for mod in forbidden:
            if f'import {mod}' in code or f'from {mod}' in code:
                return {
                    'stdout': '',
                    'stderr': f"Security Error: Import of module '{mod}' is restricted.",
                    'exitCode': 1,
                    'status': 'restricted_access'
                }

        # Create temp file
        with tempfile.NamedTemporaryFile(suffix='.py', delete=False, mode='w') as f:
            f.write(code)
            temp_path = f.name

        try:
            start_time = time.time()
            process = subprocess.run(
                ['python', temp_path],
                input=inputs if inputs else '',
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            execution_time = round(time.time() - start_time, 3)

            return {
                'stdout': process.stdout,
                'stderr': process.stderr,
                'exitCode': process.returncode,
                'status': 'success' if process.returncode == 0 else 'error',
                'executionTime': f"{execution_time}s"
            }
        except subprocess.TimeoutExpired:
            return {
                'stdout': '',
                'stderr': f'Error: Execution exceeded timeout of {self.timeout}s',
                'exitCode': 124,
                'status': 'timeout'
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def run_tests(self, code, test_cases, language='python'):
        """
        Runs multiple test cases against the code.
        """
        results = []
        passed_count = 0

        for i, tc in enumerate(test_cases):
            input_val = tc.get('input', '')
            expected_output = tc.get('output', '').strip()

            if language == 'python':
                exec_result = self.execute_python(code, inputs=input_val)
            else:
                exec_result = {'status': 'error', 'stderr': f'Language {language} not supported'}

            actual_output = exec_result.get('stdout', '').strip()

            # Simple string comparison
            passed = exec_result['status'] == 'success' and actual_output == expected_output
            if passed:
                passed_count += 1

            results.append({
                'name': tc.get('name', f'Test Case {i+1}'),
                'status': 'passed' if passed else 'failed',
                'actual': actual_output,
                'expected': expected_output,
                'error': exec_result.get('stderr', ''),
                'duration': exec_result.get('executionTime', '0s')
            })

        return {
            'totalTests': len(test_cases),
            'passedTests': passed_count,
            'failedTests': len(test_cases) - passed_count,
            'results': results
        }
