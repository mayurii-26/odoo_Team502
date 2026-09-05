import os

for root, dirs, files in os.walk('backend/app'):
    for f in files:
        if f.endswith('.py'):
            p = os.path.join(root, f)
            with open(p, 'rb') as fp:
                raw = fp.read()
            cleaned = raw.replace(b'\x96', b'-').replace(b'\x97', b'-')
            cleaned = cleaned.replace(b'\x91', b"'").replace(b'\x92', b"'")
            cleaned = cleaned.replace(b'\x93', b'"').replace(b'\x94', b'"')
            try:
                text = cleaned.decode('utf-8')
            except UnicodeDecodeError:
                text = cleaned.decode('latin-1')
            with open(p, 'w', encoding='utf-8') as fp:
                fp.write(text)

print("Encodings fixed!")
