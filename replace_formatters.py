import os
import re

def get_rel_path(base_dir, target_dir):
    rel = os.path.relpath(target_dir, base_dir)
    if not rel.startswith('.'):
        rel = './' + rel
    return rel

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip if no "new Intl.NumberFormat"
    if "new Intl.NumberFormat" not in content:
        return False

    orig_content = content

    # Extract formatter imports
    needs_currency = bool(re.search(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*(style:\s*'currency'|minimumFractionDigits)", content)) or "formatCurrency" in content
    needs_number = bool(re.search(r"new Intl\.NumberFormat\('[^']+'\)\.format", content)) or "formatNumber" in content
    needs_fraction = bool(re.search(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*minimumFractionDigits:\s*\d+\s*\}\)", content)) or "formatFraction" in content
    needs_exact_fraction = bool(re.search(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*minimumFractionDigits:\s*\d+,\s*maximumFractionDigits:\s*\d+\s*\}\)", content)) or "formatExactFraction" in content

    # Clean up inline formatters functions
    # 1. Remove formatCurrency definitions
    content = re.sub(r'const formatCurrency = \(.*?\).*?new Intl\.NumberFormat\([^\)]*\)\.format\(value\);', '', content, flags=re.DOTALL)
    # 2. Remove formatNumber definitions
    content = re.sub(r'const formatNumber = \(.*?\).*?new Intl\.NumberFormat\([^\)]*\)\.format\(value\);', '', content, flags=re.DOTALL)

    # Replace inline usage
    # minimumFractionDigits: 2, maximumFractionDigits: 2 -> formatExactFraction
    content = re.sub(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*minimumFractionDigits:\s*2,\s*maximumFractionDigits:\s*2\s*\}\)\.format", 'formatExactFraction', content)

    # minimumFractionDigits: 2 -> formatFraction
    content = re.sub(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)\.format", 'formatFraction', content)

    # currency USD -> formatCurrency
    content = re.sub(r"new Intl\.NumberFormat\('[^']+',\s*\{\s*style:\s*'currency',\s*currency:\s*'USD',\s*maximumFractionDigits:\s*0\s*\}\)\.format", 'formatCurrency', content)

    # empty / default -> formatNumber
    content = re.sub(r"new Intl\.NumberFormat\('[^']+'\)\.format", 'formatNumber', content)

    # If there are any remaining `new Intl.NumberFormat` usages, we need to handle them manually.
    if "new Intl.NumberFormat" in content:
       print(f"Warning: Not all Intl usages replaced in {filepath}")

    if content != orig_content:
        # Determine import statement to add/update
        base_dir = os.path.dirname(filepath)
        formatters_dir = "src/utils"
        rel_path = get_rel_path(base_dir, formatters_dir)
        import_path = f"{rel_path}/formatters"

        # Check if we already import from formatters
        if f"from '{import_path}'" in content:
            # We already import from there, we need to add our functions to the existing import
            # For simplicity, if we need to add things, we might just append a new import or rewrite the existing one.
            # Let's try to parse the existing import
            match = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]" + re.escape(import_path) + r"['\"]", content)
            if match:
                existing_imports = set(i.strip() for i in match.group(1).split(','))
                needed_imports = set()
                if "formatCurrency" in content: needed_imports.add("formatCurrency")
                if "formatNumber" in content: needed_imports.add("formatNumber")
                if "formatFraction" in content: needed_imports.add("formatFraction")
                if "formatExactFraction" in content: needed_imports.add("formatExactFraction")

                all_imports = existing_imports.union(needed_imports)
                new_import_str = f"import {{{', '.join(sorted(list(all_imports)))}}} from '{import_path}';"
                content = content.replace(match.group(0), new_import_str)
        else:
            # Add new import
            needed_imports = set()
            if "formatCurrency" in content: needed_imports.add("formatCurrency")
            if "formatNumber" in content: needed_imports.add("formatNumber")
            if "formatFraction" in content: needed_imports.add("formatFraction")
            if "formatExactFraction" in content: needed_imports.add("formatExactFraction")

            if needed_imports:
                new_import_str = f"import {{{', '.join(sorted(list(needed_imports)))}}} from '{import_path}';\n"

                # Insert after the last import
                last_import_idx = content.rfind("import ")
                if last_import_idx != -1:
                    end_of_last_import = content.find("\n", last_import_idx)
                    content = content[:end_of_last_import+1] + new_import_str + content[end_of_last_import+1:]
                else:
                    content = new_import_str + "\n" + content

        # Clean up empty lines created by removing formatNumber/formatCurrency definitions
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Refactored {filepath}")
        return True
    return False

import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)
for f in files:
    if f != 'src/utils/formatters.ts':
        refactor_file(f)
