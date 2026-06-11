for file in $(grep -l "new Intl.NumberFormat" $(find src -name "*.tsx" -o -name "*.ts")); do
  # Add imports if formatters from utils/formatters.ts are not already imported
  if ! grep -q "import.*formatCurrency.*from" "$file" && ! grep -q "import.*formatNumber.*from" "$file" && ! grep -q "import.*formatFraction.*from" "$file" && ! grep -q "import.*formatExactFraction.*from" "$file"; then
    # find correct relative path to utils/formatters
    rel_path=$(python3 -c "import os.path; print(os.path.relpath('src/utils/formatters', os.path.dirname('$file')))")
    # This is complex to do automatically with sed because imports are grouped.
    # We will do it with python instead.
  fi
done
