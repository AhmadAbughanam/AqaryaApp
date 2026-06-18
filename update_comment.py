with open("src/utils/formatters.ts", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith("// Shared date formatting helpers"):
        lines[i] = "// Shared date formatting helpers for UI display.\n// Caching Intl formatters to avoid expensive instantiation on every render, improving performance.\n"
        break

with open("src/utils/formatters.ts", "w") as f:
    f.writelines(lines)
