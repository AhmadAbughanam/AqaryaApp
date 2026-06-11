# Fix double semicolons using sed
for file in $(grep -lr ";;" src/); do
    sed -i 's/;;/;/g' "$file"
done
