npx prisma migrate diff \\n  --from-url="postgresql://postgres:1234@localhost:5432/platezhki?schema=public" \\n  --to-schema-datamodel=./src/prisma/schema.prisma \\n  --script > prisma-diff.sql
