import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request(
        'http://localhost:8000/auth/login',
        data=b'{"credential":"dev-bypass"}',
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
        with open('error_log.txt', 'w') as f:
            f.write(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode())
    with open('error_log.txt', 'w') as f:
        f.write(str(e.code) + " " + e.read().decode())
except Exception as e:
    print("Exception:", str(e))
    with open('error_log.txt', 'w') as f:
        f.write(str(e))
