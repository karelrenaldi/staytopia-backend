import sys
import requests

print(sys.argv[1])

headers = {
    'Authorization': 'Bearer ' + sys.argv[2],
}

files = {
    'purpose': (None, 'search'),
    'file': (sys.argv[1], open('./temp/' + sys.argv[1], 'rb')),
}

try:
    response = requests.post(
        'https://api.openai.com/v1/files', headers=headers, files=files)
    print(response.content)
except Exception:
    print("error")
