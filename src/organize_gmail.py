import subprocess
import json
import time

def run_gws(command, json_data=None):
    try:
        if json_data:
            # Escape JSON for command line
            json_str = json.dumps(json_data).replace('"', '\\"')
            command += f' --json "{json_str}"'
        
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            shell=True, 
            encoding='utf-8', 
            errors='replace'
        )
        if result.returncode != 0:
            print(f"Error running command: {command}")
            print(result.stderr)
            return None
        
        lines = result.stdout.strip().split('\n')
        json_str = None
        for line in lines:
            if line.strip().startswith('{') or line.strip().startswith('['):
                json_str = '\n'.join(lines[lines.index(line):])
                break
        if json_str:
            return json.loads(json_str)
        return {"status": "success"} # For commands that might not return JSON on success
    except Exception as e:
        print(f"Exception: {e}")
        return None

def create_label(name):
    print(f"Checking/Creating label: {name}")
    # First check if exists
    list_cmd = 'gws gmail users labels list --params "{\\\"userId\\\": \\\"me\\\"}" --format json'
    labels_data = run_gws(list_cmd)
    if labels_data and 'labels' in labels_data:
        for lbl in labels_data['labels']:
            if lbl['name'].lower() == name.lower():
                print(f"Label '{name}' already exists.")
                return lbl['id']
    
    # Not found, create
    create_cmd = 'gws gmail users labels create --params "{\\\"userId\\\": \\\"me\\\"}" --format json'
    res = run_gws(create_cmd, {"name": name})
    if res and 'id' in res:
        print(f"Label '{name}' created with ID: {res['id']}")
        return res['id']
    return None

def organize_messages(query, label_id):
    print(f"Searching for: {query}")
    list_cmd = f'gws gmail users messages list --params "{{\\\"userId\\\": \\\"me\\\", \\\"q\\\": \\\"{query}\\\"}}" --format json'
    msgs = run_gws(list_cmd)
    
    if not msgs or 'messages' not in msgs:
        print("No messages found for this query.")
        return

    for msg in msgs['messages']:
        msg_id = msg['id']
        print(f"Labeling message {msg_id} with {label_id} and marking as read...")
        
        # Modify labels: add new label, remove UNREAD
        mod_cmd = f'gws gmail users messages modify --params "{{\\\"userId\\\": \\\"me\\\", \\\"id\\\": \\\"{msg_id}\\\"}}" --format json'
        run_gws(mod_cmd, {
            "addLabelIds": [label_id],
            "removeLabelIds": ["UNREAD"]
        })

def main():
    # 1. Map existing labels (names to IDs)
    labels_map = {
        "SII AFP y Isapre": "Label_8079532066665739571",
        "Pagos y Transferencias": "Label_8",
        "Herramientas IA": "Label_3708416887679063266",
        "App Transportes": "Label_8147215992993044775",
        "E-commerce": "Label_5641463474239137530",
        "Empleo": "Label_5908460146965275834",
    }
    
    # 2. Create new labels and update map
    new_labels = ["Fútbol", "Suscripciones y Software", "PROCESADO"]
    for nl in new_labels:
        id = create_label(nl)
        if id:
            labels_map[nl] = id

    # 3. Define rules (query to label name)
    rules = [
        ("from:colmena.cl OR from:sii.cl OR from:afp", "SII AFP y Isapre"),
        ("from:bci.cl OR from:itau.cl OR from:tenpo.cl OR subject:transferencia OR subject:comprobante", "Pagos y Transferencias"),
        ("from:loom.com OR from:atlassian.com OR from:zapier.com", "Suscripciones y Software"),
        ("from:openai.com OR from:gemini OR AI OR ChatGPT", "Herramientas IA"),
        ("from:uber.com OR from:didi-food.com OR from:cabify.com", "App Transportes"),
        ("from:mercadolibre.cl OR from:amazon.com OR from:falabella.cl", "E-commerce"),
        ("from:linkedin.com OR subject:empleo OR subject:trabajo", "Empleo"),
        ("fútbol OR futbol OR partido OR cancha", "Fútbol")
    ]

    # 4. Apply rules
    for query, label_name in rules:
        if label_name in labels_map:
            organize_messages(query, labels_map[label_name])
        else:
            print(f"Skipping rule for {label_name} (ID not found)")

if __name__ == "__main__":
    main()
