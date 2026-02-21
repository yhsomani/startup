from app import create_app
from flask_jwt_extended import create_access_token
import json
import uuid

app = create_app()
challenge_id = "39a3a995-0ddd-44fc-b766-e75d620e7af5"

with app.app_context():
    token = create_access_token(identity="test-user-id")
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    client = app.test_client()

    print("\n--- Verifying POST /run ---")
    run_payload = {
        "code": "print('Hello From Sandbox')",
        "language": "python"
    }
    response = client.post(f'/api/v1/challenges/{challenge_id}/run', 
                           data=json.dumps(run_payload), 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.get_json(), indent=2)}")

    print("\n--- Verifying POST /test (Correct Code) ---")
    test_payload = {
        "code": "import sys\n# Read input from stdin\nlines = sys.stdin.readlines()\nnums = [int(line.strip()) for line in lines]\nprint(sum(nums))",
        "language": "python"
    }
    # Note: My executor blocks 'import sys' currently. Let's see if it works with input() instead.
    test_payload_v2 = {
        "code": "n1 = int(input())\nn2 = int(input())\nprint(n1 + n2)",
        "language": "python"
    }
    response = client.post(f'/api/v1/challenges/{challenge_id}/test', 
                           data=json.dumps(test_payload_v2), 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.get_json(), indent=2)}")

    print("\n--- Verifying POST /test (Incorrect Code) ---")
    test_payload_error = {
        "code": "print(99)",
        "language": "python"
    }
    response = client.post(f'/api/v1/challenges/{challenge_id}/test', 
                           data=json.dumps(test_payload_error), 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.get_json(), indent=2)}")

    print("\n--- Verifying Security (Timeout) ---")
    timeout_payload = {
        "code": "while True: pass",
        "language": "python"
    }
    response = client.post(f'/api/v1/challenges/{challenge_id}/run', 
                           data=json.dumps(timeout_payload), 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.get_json(), indent=2)}")

    print("\n--- Verifying Security (Restricted Import) ---")
    import_payload = {
        "code": "import os\nprint(os.getcwd())",
        "language": "python"
    }
    response = client.post(f'/api/v1/challenges/{challenge_id}/run', 
                           data=json.dumps(import_payload), 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.get_json(), indent=2)}")
