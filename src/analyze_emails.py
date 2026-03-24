import subprocess
import json
import sys

def run_gws(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
        if result.returncode != 0:
            print(f"Error running command: {command}")
            print(result.stderr)
            return None
        # The output might have non-json lines like "Using keyring backend"
        lines = result.stdout.strip().split('\n')
        json_str = None
        for line in lines:
            if line.strip().startswith('{') or line.strip().startswith('['):
                json_str = '\n'.join(lines[lines.index(line):])
                break
        if json_str:
            return json.loads(json_str)
        return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    print("Listing recent messages...")
    list_cmd = 'gws gmail users messages list --params "{\\\"userId\\\": \\\"me\\\", \\\"maxResults\\\": 50}" --format json'
    messages_data = run_gws(list_cmd)
    
    if not messages_data or 'messages' not in messages_data:
        print("No messages found.")
        return

    results = []
    for msg in messages_data['messages']:
        msg_id = msg['id']
        get_cmd = f'gws gmail users messages get --params "{{\\\"userId\\\": \\\"me\\\", \\\"id\\\": \\\"{msg_id}\\\"}}" --format json'
        details = run_gws(get_cmd)
        
        if details:
            headers = details.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'No Sender')
            labels = details.get('labelIds', [])
            results.append({
                'id': msg_id,
                'sender': sender,
                'subject': subject,
                'labels': labels
            })

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
